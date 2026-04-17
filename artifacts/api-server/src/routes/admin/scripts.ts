import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, scriptsTable } from "@workspace/db";
import { encrypt } from "../../lib/crypto";
import {
  CreateScriptBody,
  GetScriptParams,
  DeleteScriptParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapScript(s: typeof scriptsTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    version: s.version,
    encryptedPath: s.encryptedPath,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/admin/scripts", async (_req, res): Promise<void> => {
  const scripts = await db
    .select()
    .from(scriptsTable)
    .orderBy(desc(scriptsTable.createdAt));

  res.json(scripts.map(mapScript));
});

router.post("/admin/scripts", async (req, res): Promise<void> => {
  const parsed = CreateScriptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, version, content } = parsed.data;

  const { encrypted, iv, authTag } = encrypt(content);

  const [script] = await db
    .insert(scriptsTable)
    .values({
      name,
      description: description ?? null,
      version,
      encryptedPath: encrypted,
      iv,
      authTag,
    })
    .returning();

  res.status(201).json(mapScript(script));
});

router.get("/admin/scripts/:id", async (req, res): Promise<void> => {
  const params = GetScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [script] = await db
    .select()
    .from(scriptsTable)
    .where(eq(scriptsTable.id, params.data.id));

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.json(mapScript(script));
});

router.delete("/admin/scripts/:id", async (req, res): Promise<void> => {
  const params = DeleteScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [script] = await db
    .delete(scriptsTable)
    .where(eq(scriptsTable.id, params.data.id))
    .returning();

  if (!script) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
