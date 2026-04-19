import { Router, type IRouter } from "express";
import { db, Timestamp, COLLECTIONS } from "../../lib/firestore";
import { encrypt } from "../../lib/crypto";
import {
  CreateScriptBody,
  GetScriptParams,
  DeleteScriptParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapScript(id: string, data: any) {
  return {
    id,
    name: data.name,
    description: data.description ?? null,
    version: data.version,
    encryptedPath: data.encryptedPath,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

router.get("/admin/scripts", async (_req, res): Promise<void> => {
  const docs = await db
    .collection(COLLECTIONS.SCRIPTS)
    .orderBy("createdAt", "desc")
    .get();

  res.json(docs.docs.map((doc) => mapScript(doc.id, doc.data())));
});

router.post("/admin/scripts", async (req, res): Promise<void> => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, version, content } = parsed.data;

  const { encrypted, iv, authTag } = encrypt(content);

  const docRef = await db.collection(COLLECTIONS.SCRIPTS).add({
    name,
    description: description ?? null,
    version,
    encryptedPath: encrypted,
    iv,
    authTag,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const doc = await docRef.get();
  res.status(201).json(mapScript(doc.id, doc.data()));
});

router.get("/admin/scripts/:id", async (req, res): Promise<void> => {
  const params = GetScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = String(params.data.id);
  const doc = await db
    .collection(COLLECTIONS.SCRIPTS)
    .doc(id)
    .get();

  if (!doc.exists) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(mapScript(doc.id, doc.data()));
});

router.delete("/admin/scripts/:id", async (req, res): Promise<void> => {
  const params = DeleteScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = String(params.data.id);
  const doc = await db
    .collection(COLLECTIONS.SCRIPTS)
    .doc(id)
    .get();

  if (!doc.exists) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  await db
    .collection(COLLECTIONS.SCRIPTS)
    .doc(id)
    .delete();

  res.sendStatus(204);
});

export default router;
