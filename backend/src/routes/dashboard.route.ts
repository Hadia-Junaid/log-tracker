import express from "express";
import { authenticate } from '../middleware/auth';
import {
    getPinnedApps,
    updatePinnedApps,
    cleanupPinnedApps,
    getActiveApps,
    getAtRiskApps
} from "../controllers/dashboard.controller";
import {validateBody, validateParams} from '../middleware/validate';
import { pinnedAppsSchema } from '../validators/pinnedApps';
import { mongoDbIdSchema } from '../validators/mongoId';

const router = express.Router();


// GET /api/dashboard/pinned - Get pinned applications
router.get("/pinned/:id", authenticate, validateParams(mongoDbIdSchema), getPinnedApps);

// PATCH /api/dashboard/pinned - Update pinned application
router.patch("/pinned/:id", authenticate, validateParams(mongoDbIdSchema), validateBody(pinnedAppsSchema), updatePinnedApps);

router.patch("/pinned/:id/:appId", authenticate, updatePinnedApps);

// POST /api/dashboard/pinned/cleanup - Clean up invalid pinned applications
router.post("/pinned/:id/cleanup", authenticate, validateParams(mongoDbIdSchema), cleanupPinnedApps);

// GET /api/dashboard/active/:id - Get active applications
router.get("/active/:id", authenticate, validateParams(mongoDbIdSchema), getActiveApps);

// GET /api/dashboard/atrisk/:id - Get at-risk applications
router.get("/atrisk/:id", authenticate, validateParams(mongoDbIdSchema), getAtRiskApps);

export default router;