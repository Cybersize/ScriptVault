import { Router, type IRouter } from "express";
import { db, COLLECTIONS } from "../lib/firestore";
import { validateKey, logAccess } from "../lib/licenseUtils-firestore";
import { decrypt } from "../lib/crypto";
import { rateLimit } from "../middlewares/rateLimit";
import { ValidateLicenseBody, DeliverScriptBody, DeliverScriptParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/validate", rateLimit, async (req, res): Promise<void> => {
  const parsed = ValidateLicenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { key, hwid } = parsed.data;
  const ip = req.ip;

  const result = await validateKey(key, hwid, ip);

  if (!result.valid) {
    res.json({ valid: false, message: result.reason, licenseId: null });
    return;
  }

  res.json({ valid: true, message: "License is valid", licenseId: result.license.id });
});

router.post("/scripts/:scriptId/deliver", rateLimit, async (req, res): Promise<void> => {
  const params = DeliverScriptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = DeliverScriptBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { key, hwid } = bodyParsed.data;
  const scriptId = String(params.data.scriptId);
  const ip = req.ip;

  const scriptDoc = await db
    .collection(COLLECTIONS.SCRIPTS)
    .doc(scriptId)
    .get();

  if (!scriptDoc.exists) {
    res.status(404).json({ error: "Script not found" });
    return;
  }

  const script = scriptDoc.data();

  const result = await validateKey(key, hwid, ip, scriptId);

  if (!result.valid) {
    res.status(403).json({ error: result.reason });
    return;
  }

  // Decrypt in memory and watermark
  const decrypted = decrypt(script!.encryptedPath, script!.iv, script!.authTag);
  const watermarked = `-- Licensed to: ${key} | HWID: ${hwid}\n${decrypted}`;

  await logAccess({
    licenseId: result.license.id,
    licenseKey: key,
    hwid,
    ip: ip ?? undefined,
    scriptId,
    status: "success",
    message: `Delivered script: ${script!.name} v${script!.version}`,
  });

  res.json({ script: watermarked, version: script!.version });
});

export default router;
