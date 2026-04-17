import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db, licensesTable, scriptsTable, accessLogsTable } from "@workspace/db";

const router: IRouter = Router();

function mapLog(l: typeof accessLogsTable.$inferSelect) {
  return {
    id: l.id,
    licenseId: l.licenseId ?? null,
    licenseKey: l.licenseKey ?? null,
    scriptId: l.scriptId ?? null,
    ip: l.ip ?? null,
    hwid: l.hwid ?? null,
    status: l.status,
    message: l.message ?? null,
    createdAt: l.createdAt.toISOString(),
  };
}

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [licenseStats, scriptStats, logStats, recentActivity] = await Promise.all([
    db.select().from(licensesTable),
    db.select({ count: count() }).from(scriptsTable),
    db.select().from(accessLogsTable),
    db
      .select()
      .from(accessLogsTable)
      .orderBy(desc(accessLogsTable.createdAt))
      .limit(20),
  ]);

  const now = new Date();
  const totalLicenses = licenseStats.length;
  const revokedLicenses = licenseStats.filter((l) => l.revoked).length;
  const expiredLicenses = licenseStats.filter(
    (l) => !l.revoked && l.expiresAt != null && l.expiresAt < now
  ).length;
  const activeLicenses = totalLicenses - revokedLicenses - expiredLicenses;

  const totalScripts = scriptStats[0]?.count ?? 0;
  const totalRequests = logStats.length;
  const successfulRequests = logStats.filter((l) => l.status === "success").length;
  const failedRequests = totalRequests - successfulRequests;

  res.json({
    totalLicenses,
    activeLicenses,
    revokedLicenses,
    expiredLicenses,
    totalScripts,
    totalRequests,
    successfulRequests,
    failedRequests,
    recentActivity: recentActivity.map(mapLog),
  });
});

export default router;
