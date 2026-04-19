import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, Timestamp, COLLECTIONS } from "../../lib/firestore";
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

function mapLicense(id: string, data: any) {
  return {
    id,
    key: data.key,
    hwid: data.hwid ?? null,
    expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
    revoked: data.revoked,
    note: data.note ?? null,
    createdAt: data.createdAt.toDate().toISOString(),
    usageCount: data.usageCount,
  };
}

router.get("/admin/licenses", async (req, res): Promise<void> => {
  const params = ListLicensesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db
    .collection(COLLECTIONS.LICENSES)
    .orderBy("createdAt", "desc");

  const { status } = params.data;
  if (status === "active") {
    query = query.where("revoked", "==", false);
  } else if (status === "revoked") {
    query = query.where("revoked", "==", true);
  }

  const docs = await query.get();
  let licenses = docs.docs.map((doc) => mapLicense(doc.id, doc.data()));

  const { search } = params.data;
  if (search) {
    const s = search.toLowerCase();
    licenses = licenses.filter(
      (l) =>
        l.key.toLowerCase().includes(s) ||
        (l.note && l.note.toLowerCase().includes(s)) ||
        (l.hwid && l.hwid.toLowerCase().includes(s))
    );
  }

  res.json(licenses);
});

router.post("/admin/licenses", async (req, res): Promise<void> => {
  const parsed = CreateLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const key = generateKey();
  const expiresAt = parsed.data.expiresAt
    ? Timestamp.fromDate(new Date(parsed.data.expiresAt))
    : null;

  const docRef = await db
    .collection(COLLECTIONS.LICENSES)
    .add({
      key,
      hwid: null,
      expiresAt,
      revoked: false,
      note: parsed.data.note ?? null,
      usageCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

  const doc = await docRef.get();
  res.status(201).json(mapLicense(doc.id, doc.data()));
});

router.get("/admin/licenses/:id", async (req, res): Promise<void> => {
  const params = GetLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = String(params.data.id);
  const doc = await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .get();

  if (!doc.exists) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(doc.id, doc.data()));
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

  const id = String(params.data.id);
  const updates: any = { updatedAt: Timestamp.now() };
  if (parsed.data.revoked != null) updates.revoked = parsed.data.revoked;
  if (parsed.data.expiresAt !== undefined) {
    updates.expiresAt = parsed.data.expiresAt
      ? Timestamp.fromDate(new Date(parsed.data.expiresAt))
      : null;
  }
  if (parsed.data.note !== undefined) updates.note = parsed.data.note ?? null;
  if (parsed.data.hwid !== undefined) updates.hwid = parsed.data.hwid ?? null;

  await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .update(updates);

  const doc = await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .get();

  if (!doc.exists) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(doc.id, doc.data()));
});

router.delete("/admin/licenses/:id", async (req, res): Promise<void> => {
  const params = DeleteLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = String(params.data.id);
  await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .delete();

  res.sendStatus(204);
});

router.post("/admin/licenses/:id/revoke", async (req, res): Promise<void> => {
  const params = RevokeLicenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = String(params.data.id);
  await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .update({ revoked: true, updatedAt: Timestamp.now() });

  const doc = await db
    .collection(COLLECTIONS.LICENSES)
    .doc(id)
    .get();

  if (!doc.exists) {
    res.status(404).json({ error: "License not found" });
    return;
  }

  res.json(mapLicense(doc.id, doc.data()));
});

export default router;
