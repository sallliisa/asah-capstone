export const targetTypes = ["global"] as const;

export type TargetType = (typeof targetTypes)[number];

type PermissionDefinition = {
  code: string;
  name: string;
  description: string;
  targetType: TargetType;
  active: true;
};

type ModuleDefinition = {
  code: string;
  name: string;
  active: true;
  permissions: readonly PermissionDefinition[];
};

export const authorizationModules = [
  {
    code: "activity-categories", name: "Activity Categories", active: true,
    permissions: [
      { code: "view-activity-categories", name: "View Activity Categories", description: "View activity categories.", targetType: "global", active: true },
      { code: "create-activity-categories", name: "Create Activity Categories", description: "Create activity categories.", targetType: "global", active: true },
      { code: "update-activity-categories", name: "Update Activity Categories", description: "Update activity categories.", targetType: "global", active: true },
      { code: "delete-activity-categories", name: "Delete Activity Categories", description: "Delete activity categories.", targetType: "global", active: true },
    ],
  },

  {
    code: "activities", name: "Activities", active: true,
    permissions: [
      { code: "view-activities", name: "View Activities", description: "View activities.", targetType: "global", active: true },
      { code: "create-activities", name: "Create Activities", description: "Create activities.", targetType: "global", active: true },
      { code: "update-activities", name: "Update Activities", description: "Update activities.", targetType: "global", active: true },
    ],
  },
  {
    code: "recurring-plans", name: "Recurring Plans", active: true,
    permissions: [
      { code: "view-recurring-plans", name: "View Recurring Plans", description: "View recurring plans.", targetType: "global", active: true },
      { code: "create-recurring-plans", name: "Create Recurring Plans", description: "Create recurring plans.", targetType: "global", active: true },
      { code: "update-recurring-plans", name: "Update Recurring Plans", description: "Update recurring plans.", targetType: "global", active: true },
    ],
  },

  {
    code: "room-types", name: "Room Types", active: true,
    permissions: [
      { code: "view-room-types", name: "View Room Types", description: "View room types.", targetType: "global", active: true },
      { code: "create-room-types", name: "Create Room Types", description: "Create room types.", targetType: "global", active: true },
      { code: "update-room-types", name: "Update Room Types", description: "Update room types.", targetType: "global", active: true },
      { code: "delete-room-types", name: "Delete Room Types", description: "Delete room types.", targetType: "global", active: true },
    ],
  },

  {
    code: "rooms",
    name: "Rooms",
    active: true,
    permissions: [
      { code: "view-rooms", name: "View Rooms", description: "View rooms.", targetType: "global", active: true },
      { code: "create-rooms", name: "Create Rooms", description: "Create rooms.", targetType: "global", active: true },
      { code: "update-rooms", name: "Update Rooms", description: "Update rooms.", targetType: "global", active: true },
      { code: "delete-rooms", name: "Delete Rooms", description: "Delete rooms.", targetType: "global", active: true },
    ],
  },

  {
    code: "users",
    name: "Users",
    active: true,
    permissions: [
      { code: "view-users", name: "View Users", description: "View user accounts.", targetType: "global", active: true },
      { code: "list-users", name: "List Users", description: "List user accounts.", targetType: "global", active: true },
      { code: "detail-users", name: "Detail Users", description: "View a user account.", targetType: "global", active: true },
      { code: "create-users", name: "Create Users", description: "Create user accounts.", targetType: "global", active: true },
      { code: "update-users", name: "Update Users", description: "Update user accounts.", targetType: "global", active: true },
    ],
  },
  {
    code: "roles",
    name: "Roles",
    active: true,
    permissions: [
      { code: "view-roles", name: "View Roles", description: "View roles.", targetType: "global", active: true },
      { code: "list-roles", name: "List Roles", description: "List roles.", targetType: "global", active: true },
      { code: "detail-roles", name: "Detail Roles", description: "View a role.", targetType: "global", active: true },
      { code: "create-roles", name: "Create Roles", description: "Create roles.", targetType: "global", active: true },
      { code: "update-roles", name: "Update Roles", description: "Update roles.", targetType: "global", active: true },
      { code: "delete-roles", name: "Delete Roles", description: "Delete roles.", targetType: "global", active: true },
    ],
  },
  {
    code: "permissions",
    name: "Permissions",
    active: true,
    permissions: [
      { code: "view-permissions", name: "View Permissions", description: "View permissions.", targetType: "global", active: true },
      { code: "list-permissions", name: "List Permissions", description: "List permissions.", targetType: "global", active: true },
      { code: "detail-permissions", name: "Detail Permissions", description: "View a permission.", targetType: "global", active: true },
    ],
  },
  {
    code: "role-permissions",
    name: "Role Permissions",
    active: true,
    permissions: [
      { code: "list-role-permissions", name: "List Role Permissions", description: "List a role's permissions.", targetType: "global", active: true },
      { code: "create-role-permissions", name: "Grant Role Permission", description: "Grant a permission to a role.", targetType: "global", active: true },
      { code: "delete-role-permissions", name: "Revoke Role Permission", description: "Revoke a permission from a role.", targetType: "global", active: true },
    ],
  },
  {
    code: "role-assignments",
    name: "Role Assignments",
    active: true,
    permissions: [
      { code: "list-role-assignments", name: "List Role Assignments", description: "List a user's roles.", targetType: "global", active: true },
      { code: "create-role-assignments", name: "Assign Role", description: "Assign a role to a user.", targetType: "global", active: true },
      { code: "delete-role-assignments", name: "Unassign Role", description: "Remove a role from a user.", targetType: "global", active: true },
    ],
  },
] as const satisfies readonly ModuleDefinition[];

export type AuthorizationModuleCode = (typeof authorizationModules)[number]["code"];
export type PermissionCode = (typeof authorizationModules)[number]["permissions"][number]["code"];

export const permissionByCode = Object.freeze(
  Object.fromEntries(
    authorizationModules.flatMap((module) =>
      module.permissions.map((permission) => [permission.code, { module, permission }]),
    ),
  ) as Record<
    PermissionCode,
    {
      module: (typeof authorizationModules)[number];
      permission: (typeof authorizationModules)[number]["permissions"][number];
    }
  >,
);
