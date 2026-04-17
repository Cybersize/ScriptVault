import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, accessLogsTable } from "@workspace/db";
import { ListLogsQueryParams } from "@workspace/api-zod";

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

router.get("/admin/logs", async (req, res): Promise<void> => {
  const params = ListLogsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { licenseId, status, limit } = params.data;

  let query = db
    .select()
    .from(accessLogsTable)
    .orderBy(desc(accessLogsTable.createdAt))
    .limit(limit ?? 200)
    .$dynamic();

  if (licenseId) {
    query = query.where(eq(accessLogsTable.licenseId, licenseId));
  } else if (status) {
    query = query.where(eq(accessLogsTable.status, status));
  }

  const logs = await query;
  res.json(logs.map(mapLog));
});

export default router;
