import { Timestamp } from "firebase-admin/firestore";

export interface License {
  id: string;
  key: string;
  hwid: string | null;
  expiresAt: Timestamp | null;
  revoked: boolean;
  note: string | null;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Script {
  id: string;
  name: string;
  description: string | null;
  version: string;
  encryptedPath: string;
  iv: string;
  authTag: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AccessLog {
  id: string;
  licenseId: string | null;
  licenseKey: string | null;
  scriptId: string | null;
  ip: string | null;
  hwid: string | null;
  status: string; // success | denied | expired | revoked | hwid_mismatch
  message: string | null;
  createdAt: Timestamp;
}

export const COLLECTIONS = {
  LICENSES: "licenses",
  SCRIPTS: "scripts",
  ACCESS_LOGS: "access_logs",
};
