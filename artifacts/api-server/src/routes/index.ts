import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plantsRouter from "./plants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(plantsRouter);

export default router;
