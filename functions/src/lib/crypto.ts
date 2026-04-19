import { createDecipheriv } from "crypto";

export function decrypt(
  encryptedPath: string,
  iv: string,
  authTag: string
): string {
  const key = Buffer.from(
    process.env.SCRIPT_ENCRYPTION_KEY || "",
    "hex"
  );
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedPath, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
