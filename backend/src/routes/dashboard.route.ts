import express from "express";
import { authenticate } from '../middleware/auth';
import {
    getPinnedApps,
    addPinnedApps,
    removePinnedApps,
    getActiveApps
} from "../controllers/dashboard.controller";

const router = express.Router();


// GET /api/dashboard/pinned - Get pinned applications
router.get("/pinned/:id", authenticate, getPinnedApps);

// PATCH /api/dashboard/pinned - Update pinned application
router.patch("/pinned/:id/:appId", authenticate, addPinnedApps);

// DELETE /api/dashboard/pinned/:appId - Remove pinned application
router.delete("/pinned/:id/:appId", authenticate, removePinnedApps);

// GET /api/dashboard/active/:id - Get active applications
router.get("/active/:id", authenticate, getActiveApps);

export default router;