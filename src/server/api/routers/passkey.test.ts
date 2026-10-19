import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  AUTH_PASSKEY_DISABLED: false,
  AUTH_URL: "https://audio.example.com" as string | undefined,
}));
vi.mock("~/env", () => ({ env }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: vi.fn(async () => ({ challenge: "challenge" })),
  verifyRegistrationResponse: vi.fn(async () => ({
    verified: true,
    registrationInfo: {
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      counter: 0,
      credentialDeviceType: "multiDevice",
      credentialBackedUp: true,
      aaguid: "fbfc3007-154e-4ecc-8c0b-6e020557d7bd",
    },
  })),
}));

function createDb() {
  return {
    authenticator: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
      create: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 1 })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    account: {
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    verificationToken: {
      findFirst: vi.fn(async () => ({ token: "challenge" })),
      create: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
}

type MockDb = ReturnType<typeof createDb>;

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    expires: new Date(Date.now() + 86_400_000).toISOString(),
    passkeyAddableUntil: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "user-1", isAdmin: false, isDisabled: false },
    ...overrides,
  };
}

async function createCaller(db: MockDb, session: Session) {
  const { appRouter } = await import("~/server/api/root");
  return appRouter.createCaller({
    db: db as never,
    session,
    headers: new Headers(),
  });
}

const registrationResponse = {
  id: "AQID",
  rawId: "AQID",
  type: "public-key",
  clientExtensionResults: {},
  response: {
    clientDataJSON: "",
    attestationObject: "",
    transports: ["internal"],
  },
};

describe("passkey router", () => {
  let db: MockDb;

  beforeEach(() => {
    vi.resetModules();
    env.AUTH_PASSKEY_DISABLED = false;
    env.AUTH_URL = "https://audio.example.com";
    db = createDb();
  });

  it("rejects all procedures when passkeys are disabled", async () => {
    env.AUTH_PASSKEY_DISABLED = true;
    const caller = await createCaller(db, createSession());
    await expect(caller.passkey.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.passkey.delete({ id: "x" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lists only own passkeys without credential secrets", async () => {
    db.authenticator.findMany.mockResolvedValueOnce([
      {
        credentialID: "cred-1",
        label: null,
        aaguid: "00000000-0000-0000-0000-000000000000",
        createdAt: new Date(),
        lastUsedAt: null,
      },
    ] as never);
    const caller = await createCaller(db, createSession());
    const result = await caller.passkey.list();

    expect(db.authenticator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
    expect(result.maxPasskeys).toBe(10);
    expect(result.passkeys[0]).toMatchObject({
      id: "cred-1",
      vendor: { name: null },
    });
    expect(result.passkeys[0]).not.toHaveProperty("credentialPublicKey");
  });

  describe("registration", () => {
    it("requires a fresh sign-in", async () => {
      const caller = await createCaller(
        db,
        createSession({ passkeyAddableUntil: null }),
      );
      await expect(
        caller.passkey.getRegistrationOptions(),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects verification after the window expired", async () => {
      const caller = await createCaller(
        db,
        createSession({
          passkeyAddableUntil: new Date(Date.now() - 1).toISOString(),
        }),
      );
      await expect(
        caller.passkey.verifyRegistration({
          response: registrationResponse as never,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.authenticator.create).not.toHaveBeenCalled();
    });

    it("enforces the passkey limit", async () => {
      db.authenticator.count.mockResolvedValueOnce(10);
      const caller = await createCaller(db, createSession());
      await expect(
        caller.passkey.getRegistrationOptions(),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("stores the challenge when issuing options", async () => {
      const caller = await createCaller(db, createSession());
      await caller.passkey.getRegistrationOptions();
      expect(db.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: "passkey-registration:user-1",
          token: "challenge",
        }),
      });
    });

    it("rejects verification without a pending challenge", async () => {
      db.verificationToken.findFirst.mockResolvedValueOnce(null as never);
      const caller = await createCaller(db, createSession());
      await expect(
        caller.passkey.verifyRegistration({
          response: registrationResponse as never,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("stores account and authenticator with a trimmed label", async () => {
      const caller = await createCaller(db, createSession());
      await caller.passkey.verifyRegistration({
        response: registrationResponse as never,
        label: "  MacBook  ",
      });
      expect(db.verificationToken.deleteMany).toHaveBeenCalled();
      expect(db.account.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          provider: "passkey",
        }),
      });
      expect(db.authenticator.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          label: "MacBook",
          transports: "internal",
          aaguid: "fbfc3007-154e-4ecc-8c0b-6e020557d7bd",
        }),
      });
    });
  });

  describe("rename", () => {
    it("clears the label for an empty value", async () => {
      const caller = await createCaller(db, createSession());
      await caller.passkey.rename({ id: "cred-1", label: "   " });
      expect(db.authenticator.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", credentialID: "cred-1" },
        data: { label: null },
      });
    });

    it("rejects labels longer than 50 characters", async () => {
      const caller = await createCaller(db, createSession());
      await expect(
        caller.passkey.rename({ id: "cred-1", label: "x".repeat(51) }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects passkeys of other users", async () => {
      db.authenticator.updateMany.mockResolvedValueOnce({ count: 0 });
      const caller = await createCaller(db, createSession());
      await expect(
        caller.passkey.rename({ id: "foreign", label: "x" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("delete", () => {
    it("is allowed outside the registration window", async () => {
      const caller = await createCaller(
        db,
        createSession({ passkeyAddableUntil: null }),
      );
      await caller.passkey.delete({ id: "cred-1" });
      expect(db.authenticator.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1", credentialID: "cred-1" },
      });
      expect(db.account.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          provider: "passkey",
          providerAccountId: "cred-1",
        },
      });
    });

    it("rejects passkeys of other users", async () => {
      db.authenticator.deleteMany.mockResolvedValueOnce({ count: 0 });
      const caller = await createCaller(db, createSession());
      await expect(
        caller.passkey.delete({ id: "foreign" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("admin revokeAllPasskeys", () => {
    it("rejects non-admins", async () => {
      const caller = await createCaller(db, createSession());
      await expect(
        caller.admin.userManagement.revokeAllPasskeys({ userId: "user-2" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("deletes all passkeys of the user, also when passkeys are disabled", async () => {
      env.AUTH_PASSKEY_DISABLED = true;
      const caller = await createCaller(
        db,
        createSession({
          user: { id: "admin", isAdmin: true, isDisabled: false },
        }),
      );
      await caller.admin.userManagement.revokeAllPasskeys({ userId: "user-2" });
      expect(db.authenticator.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-2" },
      });
      expect(db.account.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-2", provider: "passkey" },
      });
    });
  });
});
