import { eq } from "drizzle-orm";
import { db, licensesTable, accessLogsTable } from "@workspace/db";
import type { License } from "@workspace/db";

export type ValidationResult =
  | { valid: true; license: License }
  | { valid: false; reason: string; status: string };

export async function validateKey(
  key: string,
  hwid: string,
  ip: string | undefined,
  scriptId?: number
): Promise<ValidationResult> {
  const [license] = await db
    .select()
    .from(licensesTable)
    .where(eq(licensesTable.key, key));

  if (!license) {
    await logAccess({ licenseKey: key, hwid, ip, scriptId, status: "denied", message: "Invalid license key" });
    return { valid: false, reason: "Invalid license key", status: "denied" };
  }

  if (license.revoked) {
    await logAccess({ licenseId: license.id, licenseKey: key, hwid, ip, scriptId, status: "revoked", message: "License has been revoked" });
    return { valid: false, reason: "License has been revoked", status: "revoked" };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    await logAccess({ licenseId: license.id, licenseKey: key, hwid, ip, scriptId, status: "expired", message: "License has expired" });
    return { valid: false, reason: "License has expired", status: "expired" };
  }

  if (license.hwid && license.hwid !== hwid) {
    await logAccess({ licenseId: license.id, licenseKey: key, hwid, ip, scriptId, status: "hwid_mismatch", message: "HWID mismatch" });
    return { valid: false, reason: "HWID mismatch — this key is bound to a different device", status: "hwid_mismatch" };
  }

  // Bind HWID on first use
  if (!license.hwid) {
    await db
      .update(licensesTable)
      .set({ hwid, usageCount: license.usageCount + 1 })
      .where(eq(licensesTable.id, license.id));
  } else {
    await db
      .update(licensesTable)
      .set({ usageCount: license.usageCount + 1 })
      .where(eq(licensesTable.id, license.id));
  }

  return { valid: true, license };
}

async function logAccess(params: {
  licenseId?: number;
  licenseKey?: string;
  hwid?: string;
  ip?: string;
  scriptId?: number;
  status: string;
  message?: string;
}): Promise<void> {
  await db.insert(accessLogsTable).values({
    licenseId: params.licenseId ?? null,
    licenseKey: params.licenseKey ?? null,
    scriptId: params.scriptId ?? null,
    ip: params.ip ?? null,
    hwid: params.hwid ?? null,
    status: params.status,
    message: params.message ?? null,
  });
}

export { logAccess };
