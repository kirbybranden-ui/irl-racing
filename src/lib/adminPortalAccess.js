// Route visibility follows verified account roles; mutation RPCs retain their own authorization.
export const isFullAdmin = access => access?.roles?.includes("full_admin") === true;
export const isSupportStaff = access => access?.isSuperAdmin === true || (access?.manufacturerRoles || []).length > 0;
export const canEnterAdminPortal = access => Boolean(access?.userId && !access.agreementRequired && (isFullAdmin(access) || access.roles?.includes("race_recorder") || isSupportStaff(access)));
export function canUseAdminRoute(access, path) {
  if (!canEnterAdminPortal(access)) return false;
  if (path === "/admin") return true;
  if (path === "/admin/race-recorder") return isFullAdmin(access) || access.roles?.includes("race_recorder") === true;
  if (["/admin/support", "/admin/manufacturer-leases"].includes(path)) return isSupportStaff(access);
  if (["/admin/funding", "/admin/appointments", "/admin/broadcasts"].includes(path)) return access.isSuperAdmin === true;
  return isFullAdmin(access);
}
export const ADMIN_WORKSPACES = [
  ["Admin home", "/admin"], ["Roles & permissions", "/admin/permissions"],
  ["Team funding & approvals", "/admin/funding"], ["Manufacturer support", "/admin/support"],
  ["Manufacturer leases", "/admin/manufacturer-leases"], ["Staff appointments", "/admin/appointments"],
  ["Appeals administration", "/admin/appeals"], ["League broadcasts", "/admin/broadcasts"],
  ["Race recorder", "/admin/race-recorder"], ["Development requests", "/admin/development-requests"],
  ["Car gallery", "/admin/car-gallery"], ["Interview administration", "/admin/interviews"],
  ["Voting administration", "/admin/votes"], ["Stories", "/admin/stories"],
  ["Messages", "/admin/messages"], ["Issues", "/admin/issues"], ["Market administration", "/admin/driver-market"], ["Live control", "/admin/live-control"],
];
