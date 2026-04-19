import { https } from "firebase-functions/v2";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import {
  CreateLicenseBody,
  UpdateLicenseBody,
  UpdateLicenseParams,
  GetLicenseParams,
  DeleteLicenseParams,
  ListLicensesQueryParams,
} from "@workspace/api-zod";
import { requireAdminSecret } from "./lib/auth";
import { COLLECTIONS, type License } from "./lib/schema";

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

export const listLicenses = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const params = ListLicensesQueryParams.safeParse(req.query);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const db = getFirestore();
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
    } catch (error: any) {
      console.error("List licenses error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const createLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const parsed = CreateLicenseBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const key = generateKey();
      const expiresAt = parsed.data.expiresAt
        ? Timestamp.fromDate(new Date(parsed.data.expiresAt))
        : null;

      const db = getFirestore();
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
    } catch (error: any) {
      console.error("Create license error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const getLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const params = GetLicenseParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const id = String(params.data.id);
      const db = getFirestore();
      const doc = await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .get();

      if (!doc.exists) {
        res.status(404).json({ error: "License not found" });
        return;
      }

      res.json(mapLicense(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Get license error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const updateLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "PATCH") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

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

      const db = getFirestore();
      await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .update(updates);

      const doc = await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .get();

      res.json(mapLicense(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Update license error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const revokeLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const params = UpdateLicenseParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const id = String(params.data.id);
      const db = getFirestore();
      await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .update({
          revoked: true,
          updatedAt: Timestamp.now(),
        });

      const doc = await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .get();

      res.json(mapLicense(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Revoke license error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const deleteLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "DELETE") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const params = DeleteLicenseParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const id = String(params.data.id);
      const db = getFirestore();
      await db
        .collection(COLLECTIONS.LICENSES)
        .doc(id)
        .delete();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete license error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);
