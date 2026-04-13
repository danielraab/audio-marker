import { createTRPCRouter } from "~/server/api/trpc";
import { userManagementRouter } from "./userManagement";
import { systemSettingsRouter } from "./systemSettings";
import { softDeletedContentRouter } from "./softDeletedContent";
import { legalInformationRouter } from "./legalInformation";
import { statisticsRouter } from "./statistics";

export const adminRouter = createTRPCRouter({
  userManagement: userManagementRouter,
  systemSettings: systemSettingsRouter,
  softDeletedContent: softDeletedContentRouter,
  legalInformation: legalInformationRouter,
  statistics: statisticsRouter,
});
