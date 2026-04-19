import { https } from "firebase-functions/v2";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { requireAdminSecret } from "./lib/auth";
import { COLLECTIONS } from "./lib/schema";

function mapScript(id: string, data: any) {
  return {
    id,
    name: data.name,
    description: data.description ?? null,
    version: data.version,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

export const listScripts = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const db = getFirestore();
      const docs = await db
        .collection(COLLECTIONS.SCRIPTS)
        .orderBy("createdAt", "desc")
        .get();

      const scripts = docs.docs.map((doc) => mapScript(doc.id, doc.data()));
      res.json(scripts);
    } catch (error: any) {
      console.error("List scripts error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const getScript = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      const scriptId = req.path.split("/").pop();
      if (!scriptId) {
        res.status(400).json({ error: "Script ID required" });
        return;
      }

      const db = getFirestore();
      const doc = await db
        .collection(COLLECTIONS.SCRIPTS)
        .doc(scriptId)
        .get();

      if (!doc.exists) {
        res.status(404).json({ error: "Script not found" });
        return;
      }

      res.json(mapScript(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Get script error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const createScript = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const { name, description, version, encryptedPath, iv, authTag } =
        req.body;

      if (!name || !encryptedPath || !iv || !authTag) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const db = getFirestore();
      const docRef = await db
        .collection(COLLECTIONS.SCRIPTS)
        .add({
          name,
          description: description ?? null,
          version: version ?? "1.0.0",
          encryptedPath,
          iv,
          authTag,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

      const doc = await docRef.get();
      res.status(201).json(mapScript(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Create script error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const updateScript = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "PATCH") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const scriptId = req.path.split("/").pop();
      if (!scriptId) {
        res.status(400).json({ error: "Script ID required" });
        return;
      }

      const updates: any = { updatedAt: Timestamp.now() };
      if (req.body.name) updates.name = req.body.name;
      if (req.body.description !== undefined)
        updates.description = req.body.description;
      if (req.body.version) updates.version = req.body.version;

      const db = getFirestore();
      await db
        .collection(COLLECTIONS.SCRIPTS)
        .doc(scriptId)
        .update(updates);

      const doc = await db
        .collection(COLLECTIONS.SCRIPTS)
        .doc(scriptId)
        .get();

      res.json(mapScript(doc.id, doc.data()));
    } catch (error: any) {
      console.error("Update script error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);

export const deleteScript = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      requireAdminSecret(req);

      if (req.method !== "DELETE") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const scriptId = req.path.split("/").pop();
      if (!scriptId) {
        res.status(400).json({ error: "Script ID required" });
        return;
      }

      const db = getFirestore();
      await db.collection(COLLECTIONS.SCRIPTS).doc(scriptId).delete();

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete script error:", error);
      res.status(401).json({ error: error.message });
    }
  }
);
