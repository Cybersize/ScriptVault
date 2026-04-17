import { Router, type IRouter } from "express";
import { eq, desc, ilike, or } from "drizzle-orm";
import { db, licensesTable } from "@workspace/db";
import { randomBytes } from "crypto";
import {
  CreateLicenseBody,
  UpdateLicenseBody,
  UpdateLicenseParams,
  GetLicenseParams,
  DeleteLicenseParams,
  RevokeLicenseParams,
  ListLicensesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateKey(): string {
  const part = () => randomBytes(4).toString("hex").toUpperCase();
  return `${part()}-${part()}-${part()}-${part()}`;
}

function mapLicense(lic: typeof licensesTable.$inferSelect) {
  return {
    id: lic.id,
    key: lic.key,
    hwid: lic.hwid ?? null,
    expiresAt: lic.expiresAt ? lic.expiresAt.toISOString() : null,
    revoked: lic.revoked,
    note: lic.note ?? null,
    createdAt: lic.createdAt.toISOString(),
    usageCount: lic.usageCount,
  };
}

router.get("/admin/licenses", async (req, res): Promise<void> => {
  const params = ListLicensesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(licensesTable).orderBy(desc(licensesTable.createdAt)).$dynamic();

  const { status, search } = params.data;
  if (status === "active") {
    query = query.where(eq(licensesTable.revoked, false));
  } else if (status === "revoked") {
    query = query.where(eq(licensesTable.revoked, true));
  }

  const licenses = await query;

  let result = licenses;
  if (search) {
    const s = search.toLowerCase();
    result = licenses.filter(
      (l) =>
        l.key.toLowerCase().includes(s) ||
        (l.note && l.note.toLowerCase().includes(s)) ||
        (l.hwid && l.hwid.toLowerCase().includes(s))
    );
  }

  res.json(result.map(mapLicense));
});

router.post("/admin/licenses", async (req, res): Promise<void> => {
  const parsed = CreateLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const key = generateKey();
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  const [license] = await db
    .insert(licensesTable)
    .values({
      key,
      expiresAt: expiresAt ?? undefined,
      note: parsed.data.note ?? null,
    })
    .returning();

  res.status(201).json(mapLicense(license));
});

router.get("/admin/licenses/:id", async (req, res): Promise<void> => {
  const params = GetLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [license] = await db
    .select()
    .from(licensesTable)
    .where(eq(licensesTable.id, params.data.id));

  if (!license) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(license));
});

router.patch("/admin/licenses/:id", async (req, res): Promise<void> => {
  const params = UpdateLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof licensesTable.$inferInsert> = {};
  if (parsed.data.revoked != null) updates.revoked = parsed.data.revoked;
  if (parsed.data.expiresAt !== undefined) {
    updates.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
  }
  if (parsed.data.note !== undefined) updates.note = parsed.data.note ?? null;
  if (parsed.data.hwid !== undefined) updates.hwid = parsed.data.hwid ?? null;

  const [license] = await db
    .update(licensesTable)
    .set(updates)
    .where(eq(licensesTable.id, params.data.id))
    .returning();

  if (!license) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(license));
});

router.delete("/admin/licenses/:id", async (req, res): Promise<void> => {
  const params = DeleteLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [license] = await db
    .delete(licensesTable)
    .where(eq(licensesTable.id, params.data.id))
    .returning();

  if (!license) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/admin/licenses/:id/revoke", async (req, res): Promise<void> => {
  const params = RevokeLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [license] = await db
    .update(licensesTable)
    .set({ revoked: true })
    .where(eq(licensesTable.id, params.data.id))
    .returning();

  if (!license) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(license));
});

export default router;
