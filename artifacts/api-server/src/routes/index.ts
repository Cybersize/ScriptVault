import { Router, type IRouter } from "express";
import healthRouter from "./health";
import validateRouter from "./validate";
import adminLicensesRouter from "./admin/licenses";
import adminScriptsRouter from "./admin/scripts";
import adminLogsRouter from "./admin/logs";
import adminStatsRouter from "./admin/stats";
import { adminAuth } from "../middlewares/adminAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(validateRouter);

// Admin routes — protected by adminAuth middleware
router.use(adminAuth, adminLicensesRouter);
router.use(adminAuth, adminScriptsRouter);
router.use(adminAuth, adminLogsRouter);
router.use(adminAuth, adminStatsRouter);

export default router;
