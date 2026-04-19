import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin only once
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || "scriptvault-4da93";
  
  // Use default credentials or service account key
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      // Use Application Default Credentials (gcloud auth application-default login)
      initializeApp({
        projectId,
      });
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err);
    throw err;
  }
}

const db = getFirestore();

// Set emulator settings if environment variable is set
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`Connected to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

export { db, Timestamp };

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
  status: string;
  message: string | null;
  createdAt: Timestamp;
}

export const COLLECTIONS = {
  LICENSES: "licenses",
  SCRIPTS: "scripts",
  ACCESS_LOGS: "access_logs",
};
