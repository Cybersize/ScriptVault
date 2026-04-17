import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    res.status(500).json({ error: "Admin secret not configured" });
    return;
  }
  const provided = req.headers["x-admin-secret"];
  if (!provided || provided !== adminSecret) {
    res.status(401).json({ error: "Unauthorized — invalid admin secret" });
    return;
  }
  next();
}
