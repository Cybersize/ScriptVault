import { https } from "firebase-functions/v2";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  ValidateLicenseBody,
  DeliverScriptBody,
  DeliverScriptParams,
} from "@workspace/api-zod";
import { validateKey, logAccess } from "./lib/licenseUtils";
import { decrypt } from "./lib/crypto";
import { withRateLimit } from "./lib/rateLimit";
import { COLLECTIONS } from "./lib/schema";

export const validateLicense = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      await withRateLimit(req, res, async () => {
        if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
        }

        const parsed = ValidateLicenseBody.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.message });
          return;
        }

        const { key, hwid } = parsed.data;
        const ip = req.ip;

        const result = await validateKey(key, hwid, ip);

        if (!result.valid) {
          res.json({
            valid: false,
            message: result.reason,
            licenseId: null,
          });
          return;
        }

        res.json({
          valid: true,
          message: "License is valid",
          licenseId: result.license.id,
        });
      });
    } catch (error: any) {
      console.error("Validate license error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

export const deliverScript = https.onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      await withRateLimit(req, res, async () => {
        if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
        }

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

        const db = getFirestore();
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

        // Decrypt and watermark
        const decrypted = decrypt(
          script!.encryptedPath,
          script!.iv,
          script!.authTag
        );
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

        res.json({
          script: watermarked,
          version: script!.version,
        });
      });
    } catch (error: any) {
      console.error("Deliver script error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);
