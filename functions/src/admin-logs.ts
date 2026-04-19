import { https } from "firebase-functions/v2";
import { getFirestore } from "firebase-admin/firestore";
import { requireAdminSecret } from "./lib/auth";
import { COLLECTIONS } from "./lib/schema";

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

export const listLogs = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const limit = Math.min(
        parseInt(req.query.limit as string) || 100,
        1000
      );
      const licenseId = req.query.licenseId as string;

      const db = getFirestore();
      let query = db
        .collection(COLLECTIONS.ACCESS_LOGS)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (licenseId) {
        query = query.where("licenseId", "==", licenseId);
      }

      const docs = await query.get();
      const logs = docs.docs.map((doc) => mapLog(doc.id, doc.data()));

      res.json(logs);
    } catch (error: any) {
      console.error("List logs error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const getStats = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const db = getFirestore();

      // Count licenses
      const licensesSnapshot = await db
        .collection(COLLECTIONS.LICENSES)
        .count()
        .get();
      const totalLicenses = licensesSnapshot.data().count;

      // Count active licenses
      const activeLicensesSnapshot = await db
        .collection(COLLECTIONS.LICENSES)
        .where("revoked", "==", false)
        .count()
        .get();
      const activeLicenses = activeLicensesSnapshot.data().count;

      // Count scripts
      const scriptsSnapshot = await db
        .collection(COLLECTIONS.SCRIPTS)
        .count()
        .get();
      const totalScripts = scriptsSnapshot.data().count;

      // Count access logs
      const logsSnapshot = await db
        .collection(COLLECTIONS.ACCESS_LOGS)
        .count()
        .get();
      const totalLogs = logsSnapshot.data().count;

      // Get recent logs by status
      const recentLogsSnapshot = await db
        .collection(COLLECTIONS.ACCESS_LOGS)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const statuses: Record<string, number> = {};
      recentLogsSnapshot.docs.forEach((doc) => {
        const status = doc.data().status;
        statuses[status] = (statuses[status] || 0) + 1;
      });

      res.json({
        licenses: {
          total: totalLicenses,
          active: activeLicenses,
          revoked: totalLicenses - activeLicenses,
        },
        scripts: totalScripts,
        logs: totalLogs,
        recentStatuses: statuses,
      });
    } catch (error: any) {
      console.error("Get stats error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);
