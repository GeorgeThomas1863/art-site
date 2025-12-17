import express from "express";

import CONFIG from "../config/config.js";
import requireAuth from "./auth.js";
import { authController } from "../controllers/auth-controller.js";
import { mainDisplay, adminDisplay, display404, display500, display401 } from "../controllers/display-controller.js";
import { uploadPicController } from "../controllers/data-controller.js";
import { upload } from "../src/util/upload.js";

const router = express.Router();

// Login AUTH route
router.post("/site-auth-route", authController);

router.get("/401", display401);

router.get("/admin", requireAuth, adminDisplay);

router.post("/upload-pic-route", requireAuth, upload.single("image"), uploadPicController);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
