import { unstable_cache } from "next/cache";
import { db } from "~/server/db";
import { HEAD_INJECTION_KEY, HEAD_INJECTION_CACHE_TAG } from "~/server/api/routers/admin/systemSettings";

export const getHeadInjection = unstable_cache(
    async (): Promise<string> => {
        const setting = await db.systemSetting.findUnique({
            where: { key: HEAD_INJECTION_KEY },
        });
        return setting?.value ?? "";
    },
    [HEAD_INJECTION_KEY],
    { tags: [HEAD_INJECTION_CACHE_TAG] },
);
