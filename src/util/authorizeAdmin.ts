type AdminUser = { id: string; name: string };

function authorizeAdmin(password: string | undefined): AdminUser | null {
  if (!password || !process.env.ADMIN_PASSWORD) {
    return null;
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return null;
  }
  return { id: "admin", name: "Admin" };
}

export { authorizeAdmin };
export type { AdminUser };
