import { Router, type IRouter } from "express";
import { db, COLLECTIONS } from "../../lib/firestore";

const router: IRouter = Router();

function mapLog(id: string, data: any) {
  return {
    id,
    licenseId: data.licenseId ?? null,
    licenseKey: data.licenseKey ?? null,
    scriptId: data.scriptId ?? null,
    ip: data.ip ?? null,
    hwid: data.hwid ?? null,
    status: data.status,
    message: data.message ?? null,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [licensesDocs, scriptsDocs, accessLogsDocs, recentLogsDocs] = await Promise.all([
    db.collection(COLLECTIONS.LICENSES).get(),
    db.collection(COLLECTIONS.SCRIPTS).get(),
    db.collection(COLLECTIONS.ACCESS_LOGS).get(),
    db
      .collection(COLLECTIONS.ACCESS_LOGS)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get(),
  ]);

  const licenses = licensesDocs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const scripts = scriptsDocs.docs;
  const logs = accessLogsDocs.docs.map((doc) => doc.data());
  const recentLogs = recentLogsDocs.docs;

  const now = new Date();
  const totalLicenses = licenses.length;
  const revokedLicenses = licenses.filter((l) => l.revoked).length;
  const expiredLicenses = licenses.filter(
    (l) =>
      !l.revoked &&
      l.expiresAt != null &&
      l.expiresAt.toDate() < now
  ).length;
  const activeLicenses = totalLicenses - revokedLicenses - expiredLicenses;

  const totalScripts = scripts.length;
  const totalRequests = logs.length;
  const successfulRequests = logs.filter((l) => l.status === "success").length;
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
    recentActivity: recentLogs.map((doc) => mapLog(doc.id, doc.data())),
  });
});

export default router;
