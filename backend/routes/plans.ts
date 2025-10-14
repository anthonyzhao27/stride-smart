import { Router } from "express";
import { authenticateToken } from "../auth/middleware";
import { createPlanDay } from "../controllers/plans/createPlanDay";
import { getPlans } from "../controllers/plans/getPlans";
import { getPlanById } from "../controllers/plans/getPlanById";
import { updatePlan } from "../controllers/plans/updatePlan";
import { deletePlan } from "../controllers/plans/deletePlan";

const router = Router();

// Optional: protect routes using Cognito auth like workouts
router.use(authenticateToken);

router.post("/", createPlanDay);
router.get("/", getPlans);
router.get("/:id", getPlanById);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
