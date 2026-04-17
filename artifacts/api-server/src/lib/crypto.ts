import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.SCRIPT_ENCRYPTION_KEY;

function getKey(): Buffer {
  if (!KEY_HEX) {
    throw new Error("SCRIPT_ENCRYPTION_KEY environment variable is not set");
  }
  const buf = Buffer.from(KEY_HEX, "hex");
  if (buf.length !== 32) {
    throw new Error("SCRIPT_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return buf;
}

export function encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encryptedBuf = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encryptedBuf.toString("base64"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decrypt(encrypted: string, ivHex: string, authTagHex: string): string {
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
