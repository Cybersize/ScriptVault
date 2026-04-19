import { db, Timestamp, COLLECTIONS, type License } from "./firestore";

export type ValidationResult =
  | { valid: true; license: License }
  | { valid: false; reason: string; status: string };

export async function validateKey(
  key: string,
  hwid: string,
  ip: string | undefined,
  scriptId?: string
): Promise<ValidationResult> {
  // Find license by key
  const licenseDocs = await db
    .collection(COLLECTIONS.LICENSES)
    .where("key", "==", key)
    .limit(1)
    .get();

  if (licenseDocs.empty) {
    await logAccess({
      licenseKey: key,
      hwid,
      ip,
      scriptId,
      status: "denied",
      message: "Invalid license key",
    });
    return {
      valid: false,
      reason: "Invalid license key",
      status: "denied",
    };
  }

  const licenseDoc = licenseDocs.docs[0];
  const licenseData = licenseDoc.data();
  const license: License = {
    id: licenseDoc.id,
    key: licenseData.key,
    hwid: licenseData.hwid ?? null,
    expiresAt: licenseData.expiresAt ?? null,
    revoked: licenseData.revoked,
    note: licenseData.note ?? null,
    usageCount: licenseData.usageCount || 0,
    createdAt: licenseData.createdAt,
    updatedAt: licenseData.updatedAt,
  };

  if (license.revoked) {
    await logAccess({
      licenseId: license.id,
      licenseKey: key,
      hwid,
      ip,
      scriptId,
      status: "revoked",
      message: "License has been revoked",
    });
    return {
      valid: false,
      reason: "License has been revoked",
      status: "revoked",
    };
  }

  if (license.expiresAt) {
    const expiresDate = license.expiresAt.toDate();
    if (expiresDate < new Date()) {
      await logAccess({
        licenseId: license.id,
        licenseKey: key,
        hwid,
        ip,
        scriptId,
        status: "expired",
        message: "License has expired",
      });
      return {
        valid: false,
        reason: "License has expired",
        status: "expired",
      };
    }
  }

  if (license.hwid && license.hwid !== hwid) {
    await logAccess({
      licenseId: license.id,
      licenseKey: key,
      hwid,
      ip,
      scriptId,
      status: "hwid_mismatch",
      message: "HWID mismatch",
    });
    return {
      valid: false,
      reason: "HWID mismatch — this key is bound to a different device",
      status: "hwid_mismatch",
    };
  }

  // Bind HWID on first use and increment usage count
  await db
    .collection(COLLECTIONS.LICENSES)
    .doc(license.id)
    .update({
      hwid: license.hwid || hwid,
      usageCount: (license.usageCount || 0) + 1,
      updatedAt: Timestamp.now(),
    });

  return { valid: true, license };
}

async function logAccess(params: {
  licenseId?: string;
  licenseKey?: string;
  hwid?: string;
  ip?: string;
  scriptId?: string;
  status: string;
  message?: string;
}): Promise<void> {
  await db.collection(COLLECTIONS.ACCESS_LOGS).add({
    licenseId: params.licenseId ?? null,
    licenseKey: params.licenseKey ?? null,
    scriptId: params.scriptId ?? null,
    ip: params.ip ?? null,
    hwid: params.hwid ?? null,
    status: params.status,
    message: params.message ?? null,
    createdAt: Timestamp.now(),
  });
}

export { logAccess };
