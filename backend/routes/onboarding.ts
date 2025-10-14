import { Router } from "express";
import { authenticateToken } from "../auth/middleware";
import { getOnboardingProfile } from "../controllers/onboarding/getOnboardingProfile";
import { upsertOnboardingProfile } from "../controllers/onboarding/upsertOnboardingProfile";

const router = Router();

// Require Cognito auth for onboarding routes
router.use(authenticateToken);

router.get("/", getOnboardingProfile);
router.post("/", upsertOnboardingProfile);

export default router;