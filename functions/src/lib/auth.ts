export function requireAdminSecret(req: any): void {
  const secret = req.headers["x-admin-secret"] as string;
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    throw new Error("Admin secret not configured");
  }

  if (!secret || secret !== expectedSecret) {
    throw new Error("Invalid admin secret");
  }
}

export function getRateLimitKey(req: any): string {
  return req.ip || "unknown";
}
