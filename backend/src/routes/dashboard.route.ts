import express from "express";
import { authenticate } from '../middleware/auth';
import {
    getPinnedApps,
    updatePinnedApps,
    getActiveApps,
    getAtRiskApps
} from "../controllers/dashboard.controller";

const router = express.Router();


// GET /api/dashboard/pinned - Get pinned applications
router.get("/pinned/:id", authenticate, getPinnedApps);

// PATCH /api/dashboard/pinned - Update pinned application
router.patch("/pinned/:id", authenticate, updatePinnedApps);

router.patch("/pinned/:id/:appId", authenticate, updatePinnedApps);

// GET /api/dashboard/active/:id - Get active applications
router.get("/active/:id", authenticate, getActiveApps);

// GET /api/dashboard/atrisk/:id - Get at-risk applications
router.get("/atrisk/:id", authenticate, getAtRiskApps);

export default router;