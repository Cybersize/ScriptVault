import { https } from "firebase-functions/v2";
import { listLicenses, createLicense, getLicense, updateLicense, deleteLicense, revokeLicense } from "./admin-licenses";
import { listScripts, getScript, createScript, updateScript, deleteScript } from "./admin-scripts";
import { listLogs, getStats } from "./admin-logs";
import { validateLicense, deliverScript } from "./validate";
import { healthz } from "./health";

// Route dispatcher
export const api = https.onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const path = req.path;

  // Health check
  if (path === "/api/healthz") {
    return await healthz(req, res);
  }

  // Validate license
  if (path === "/api/validate" && req.method === "POST") {
    return await validateLicense(req, res);
  }

  // Deliver script
  if (path.match(/^\/api\/scripts\/[^/]+\/deliver$/) && req.method === "POST") {
    return await deliverScript(req, res);
  }

  // Admin - List licenses
  if (path === "/api/admin/licenses" && req.method === "GET") {
    return await listLicenses(req, res);
  }

  // Admin - Create license
  if (path === "/api/admin/licenses" && req.method === "POST") {
    return await createLicense(req, res);
  }

  // Admin - Get license
  if (path.match(/^\/api\/admin\/licenses\/[^/]+$/) && req.method === "GET") {
    return await getLicense(req, res);
  }

  // Admin - Update license
  if (path.match(/^\/api\/admin\/licenses\/[^/]+$/) && req.method === "PATCH") {
    return await updateLicense(req, res);
  }

  // Admin - Delete license
  if (path.match(/^\/api\/admin\/licenses\/[^/]+$/) && req.method === "DELETE") {
    return await deleteLicense(req, res);
  }

  // Admin - Revoke license
  if (path.match(/^\/api\/admin\/licenses\/[^/]+\/revoke$/) && req.method === "POST") {
    return await revokeLicense(req, res);
  }

  // Admin - List scripts
  if (path === "/api/admin/scripts" && req.method === "GET") {
    return await listScripts(req, res);
  }

  // Admin - Create script
  if (path === "/api/admin/scripts" && req.method === "POST") {
    return await createScript(req, res);
  }

  // Admin - Get script
  if (path.match(/^\/api\/admin\/scripts\/[^/]+$/) && req.method === "GET") {
    return await getScript(req, res);
  }

  // Admin - Update script
  if (path.match(/^\/api\/admin\/scripts\/[^/]+$/) && req.method === "PATCH") {
    return await updateScript(req, res);
  }

  // Admin - Delete script
  if (path.match(/^\/api\/admin\/scripts\/[^/]+$/) && req.method === "DELETE") {
    return await deleteScript(req, res);
  }

  // Admin - List logs
  if (path === "/api/admin/logs" && req.method === "GET") {
    return await listLogs(req, res);
  }

  // Admin - Get stats
  if (path === "/api/admin/stats" && req.method === "GET") {
    return await getStats(req, res);
  }

  // Not found
  res.status(404).json({ error: "Not found" });
});
