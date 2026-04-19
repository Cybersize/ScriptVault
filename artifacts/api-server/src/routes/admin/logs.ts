import { Router, type IRouter } from "express";
import { db, COLLECTIONS } from "../../lib/firestore";
import { ListLogsQueryParams } from "@workspace/api-zod";

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

router.get("/admin/logs", async (req, res): Promise<void> => {
  const params = ListLogsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { licenseId, status, limit } = params.data;

  let query = db
    .collection(COLLECTIONS.ACCESS_LOGS)
    .orderBy("createdAt", "desc")
    .limit(limit ?? 200);

  if (licenseId) {
    query = query.where("licenseId", "==", licenseId);
  } else if (status) {
    query = query.where("status", "==", status);
  }

  const docs = await query.get();
  res.json(docs.docs.map((doc) => mapLog(doc.id, doc.data())));
});

export default router;
