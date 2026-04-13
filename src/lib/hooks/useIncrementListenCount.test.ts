import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIncrementListenCount } from "./useIncrementListenCount";

describe("useIncrementListenCount", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should increment listen count on first call", () => {
    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    expect(mockMutate).toHaveBeenCalledWith(
      { id: "audio-123" },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("should not increment if already incremented for the same item", () => {
    const incrementMutation = { mutate: mockMutate };

    const { rerender } = renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Re-render with the same props
    rerender();

    // Should still only be called once
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("should increment again for a different item", () => {
    const incrementMutation = { mutate: mockMutate };

    const { rerender } = renderHook(
      ({ id }) =>
        useIncrementListenCount({
          id,
          type: "audio",
          incrementMutation,
        }),
      { initialProps: { id: "audio-123" } },
    );

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      { id: "audio-123" },
      expect.any(Object),
    );

    // Change to a different item
    rerender({ id: "audio-456" });

    expect(mockMutate).toHaveBeenCalledTimes(2);
    expect(mockMutate).toHaveBeenLastCalledWith(
      { id: "audio-456" },
      expect.any(Object),
    );
  });

  it("should store timestamp in localStorage after successful increment", () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    // Get the onSuccess callback and call it
    const callArgs = mockMutate.mock.calls[0] as [
      { id: string },
      { onSuccess?: () => void } | undefined,
    ];
    const onSuccessCallback = callArgs?.[1]?.onSuccess;
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "audio_listen_audio-123",
      now.toString(),
    );
  });

  it("should not increment if listened within the last 2 hours", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour ago

    vi.setSystemTime(now);
    localStorage.getItem = vi.fn(() => oneHourAgo.toString());

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should increment if listened more than 2 hours ago", () => {
    const now = Date.now();
    const threeHoursAgo = now - 3 * 60 * 60 * 1000; // 3 hours ago

    vi.setSystemTime(now);
    localStorage.getItem = vi.fn(() => threeHoursAgo.toString());

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    expect(mockMutate).toHaveBeenCalledWith(
      { id: "audio-123" },
      expect.any(Object),
    );
  });

  it("should use correct storage key for playlists", () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "playlist-456",
        type: "playlist",
        incrementMutation,
      }),
    );

    // Get the onSuccess callback and call it
    const callArgs = mockMutate.mock.calls[0] as [
      { id: string },
      { onSuccess?: () => void } | undefined,
    ];
    const onSuccessCallback = callArgs?.[1]?.onSuccess;
    if (onSuccessCallback) {
      onSuccessCallback();
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "playlist_listen_playlist-456",
      now.toString(),
    );
  });

  it("should handle edge case at exactly 2 hours", () => {
    const now = Date.now();
    const exactlyTwoHours = now - 2 * 60 * 60 * 1000;

    vi.setSystemTime(now);
    localStorage.getItem = vi.fn(() => exactlyTwoHours.toString());

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    // At exactly 2 hours, should increment (< operator, not <=)
    expect(mockMutate).toHaveBeenCalled();
  });

  it("should handle invalid localStorage data gracefully", () => {
    localStorage.getItem = vi.fn(() => "invalid-number");

    const incrementMutation = { mutate: mockMutate };

    renderHook(() =>
      useIncrementListenCount({
        id: "audio-123",
        type: "audio",
        incrementMutation,
      }),
    );

    // Should still attempt to increment when parsing fails (NaN behavior)
    expect(mockMutate).toHaveBeenCalled();
  });
});
