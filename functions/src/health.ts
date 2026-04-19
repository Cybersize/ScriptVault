import { https } from "firebase-functions/v2";

export const healthz = https.onRequest(
  { cors: true },
  async (_req, res): Promise<void> => {
    res.json({ status: "ok" });
  }
);
