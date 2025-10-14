import { Router } from "express";
import { authenticateToken } from "../auth/middleware";
import { createWorkout } from "../controllers/workouts/createWorkout";
import { getWorkouts } from "../controllers/workouts/getWorkouts";
import { getWorkoutById } from "../controllers/workouts/getWorkoutById";
import { updateWorkout } from "../controllers/workouts/updateWorkout";
import { deleteWorkout } from "../controllers/workouts/deleteWorkout";

const router = Router();

// Require Cognito auth for all workout routes
router.use(authenticateToken);

router.post("/", createWorkout);
router.get("/", getWorkouts);
router.get("/:id", getWorkoutById);
router.put("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

export default router;
