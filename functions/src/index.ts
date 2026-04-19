import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
initializeApp();

// Initialize Firestore
getFirestore();

// Export the main API function
export { api } from "./api";
