import { Router, type IRouter } from "express";
import diagnoseRouter from "./diagnose";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diagnoseRouter);

export default router;
