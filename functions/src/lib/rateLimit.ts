import { getFirestore, Timestamp } from "firebase-admin/firestore";

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 30;

async function checkRateLimit(key: string): Promise<boolean> {
  const db = getFirestore();
  const now = Timestamp.now();
  const windowStart = new Timestamp(now.seconds - RATE_LIMIT_WINDOW, 0);

  const rateLimitRef = db.collection("_rate_limits").doc(key);
  const doc = await rateLimitRef.get();

  if (!doc.exists) {
    await rateLimitRef.set({
      count: 1,
      resetAt: new Timestamp(now.seconds + RATE_LIMIT_WINDOW, 0),
    });
    return true;
  }

  const data = doc.data();
  const resetAt = data?.resetAt as Timestamp;

  if (resetAt.toDate() < new Date()) {
    await rateLimitRef.set({
      count: 1,
      resetAt: new Timestamp(now.seconds + RATE_LIMIT_WINDOW, 0),
    });
    return true;
  }

  const count = data?.count || 0;
  if (count >= MAX_REQUESTS) {
    return false;
  }

  await rateLimitRef.update({ count: count + 1 });
  return true;
}

export async function withRateLimit(
  req: any,
  res: any,
  handler: () => Promise<void>
): Promise<void> {
  const key = req.ip || "unknown";
  const allowed = await checkRateLimit(key);

  if (!allowed) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  return handler();
}
