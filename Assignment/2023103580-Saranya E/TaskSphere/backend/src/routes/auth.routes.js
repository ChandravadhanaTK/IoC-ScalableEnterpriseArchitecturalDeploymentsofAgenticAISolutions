import { Router } from "express";

import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/auth.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public Routes
router.post("/register", registerUser);

router.post("/login", loginUser);

// Protected Route
router.get(
  "/me",
  authenticate,
  getMe
);

export default router;