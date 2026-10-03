import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import authRouter from "./auth";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth);
router.use(ticketsRouter);
router.use(usersRouter);

export default router;
