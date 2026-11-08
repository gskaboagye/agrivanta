import { getDatabase } from "@/lib/mongodb";

export type PlatformSettings = {
  registrationEnabled: boolean;
  marketplaceEnabled: boolean;
  announcement: {
    enabled: boolean;
    title: string;
    message: string;
  };
  maintenanceMode: boolean;
  updatedAt: Date | null;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  registrationEnabled: true,
  marketplaceEnabled: true,
  announcement: {
    enabled: false,
    title: "",
    message: "",
  },
  maintenanceMode: false,
  updatedAt: null,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = await getDatabase();

  const document = await db
    .collection("platformSettings")
    .findOne({ _id: "global" } as never);

  if (!document) {
    return DEFAULT_PLATFORM_SETTINGS;
  }

  const announcement =
    typeof document.announcement === "object" &&
    document.announcement !== null
      ? document.announcement as Record<string, unknown>
      : {};

  return {
    registrationEnabled:
      typeof document.registrationEnabled === "boolean"
        ? document.registrationEnabled
        : DEFAULT_PLATFORM_SETTINGS.registrationEnabled,

    marketplaceEnabled:
      typeof document.marketplaceEnabled === "boolean"
        ? document.marketplaceEnabled
        : DEFAULT_PLATFORM_SETTINGS.marketplaceEnabled,

    announcement: {
      enabled:
        typeof announcement.enabled === "boolean"
          ? announcement.enabled
          : false,
      title:
        typeof announcement.title === "string"
          ? announcement.title
          : "",
      message:
        typeof announcement.message === "string"
          ? announcement.message
          : "",
    },

    maintenanceMode:
      typeof document.maintenanceMode === "boolean"
        ? document.maintenanceMode
        : DEFAULT_PLATFORM_SETTINGS.maintenanceMode,

    updatedAt:
      document.updatedAt instanceof Date
        ? document.updatedAt
        : null,
  };
}