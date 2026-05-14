/**
 * Permissions matrix for Tazalyk admin dashboard.
 *
 * Roles:
 * - super_admin: full access, approves user registrations, edits transport data
 * - admin: manages staff & drivers data, approves client refusals, NO transport edit, NO registration approval
 * - operator: works with applications, initiates client refusals (which need admin approval)
 */

export type Role = "super_admin" | "admin" | "operator";

export function getRole(user: any): Role | null {
  const r = user?.role;
  if (r === "super_admin" || r === "admin" || r === "operator") return r;
  return null;
}

// --- High-level access checks ---

export const can = {
  // Operators / staff management page
  viewStaff: (u: any) => ["admin", "super_admin"].includes(getRole(u) ?? ""),
  editStaff: (u: any) => ["admin", "super_admin"].includes(getRole(u) ?? ""),
  approveRegistration: (u: any) => getRole(u) === "super_admin",
  changeUserRole: (u: any) => getRole(u) === "super_admin",
  deleteUser: (u: any) => getRole(u) === "super_admin",

  // Transport
  editTransport: (u: any) => getRole(u) === "super_admin",
  addTransport: (u: any) => getRole(u) === "super_admin",
  editTransportExpenses: (u: any) => ["admin", "super_admin"].includes(getRole(u) ?? ""),

  // Applications & refusals
  rejectApplication: (u: any) => ["operator", "admin", "super_admin"].includes(getRole(u) ?? ""),
  approveRefusal: (u: any) => ["admin", "super_admin"].includes(getRole(u) ?? ""),
};
