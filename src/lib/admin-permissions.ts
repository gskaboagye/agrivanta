export const ADMIN_ROLES = [
  "super_admin",
  "report_manager",
  "report_officer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "manage_administrators",
  "manage_platform_settings",
  "manage_users",
  "manage_listings",
  "manage_news",
  "manage_agricultural_reports",
  "view_platform_analytics",
  "view_all_reports",
  "view_assigned_reports",
  "assign_reports",
  "investigate_reports",
  "communicate_with_reporters",
  "add_internal_notes",
  "resolve_reports",
  "dismiss_reports",
  "view_report_analytics",
] as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<
  AdminRole,
  readonly AdminPermission[]
> = {
  super_admin: ADMIN_PERMISSIONS,
  report_manager: [
    "view_all_reports",
    "assign_reports",
    "investigate_reports",
    "communicate_with_reporters",
    "add_internal_notes",
    "resolve_reports",
    "dismiss_reports",
    "view_report_analytics",
  ],
  report_officer: [
    "view_assigned_reports",
    "investigate_reports",
    "communicate_with_reporters",
    "add_internal_notes",
  ],
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  report_manager: "Report Manager",
  report_officer: "Report Officer",
};

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    ADMIN_ROLES.some((role) => role === value)
  );
}

export function getRolePermissions(
  role: AdminRole
): readonly AdminPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: AdminRole,
  permissions: readonly AdminPermission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, permission)
  );
}

export function hasAllPermissions(
  role: AdminRole,
  permissions: readonly AdminPermission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, permission)
  );
}
