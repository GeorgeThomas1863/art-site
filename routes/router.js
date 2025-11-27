import express from "express";

import CONFIG from "../config/config.js";
// import { requireAuth, requireAdminAuth } from "./auth.js";
// import { authController, adminAuthController } from "../controllers/auth-controller.js";
import { mainDisplay, adminDisplay, display404, display500, display401 } from "../controllers/display-controller.js";

// const {
//   updateDisplayDataRoute,
//   adminAuthRoute,
//   adminCommandRoute,
//   adminDataRoute,
//   adminPollingRoute,
// } = CONFIG;

const router = express.Router();

// Login AUTH route
// router.post("/site-auth-route", authController);
// router.post(adminAuthRoute, adminAuthController);
// router.get("/401", display401);

//-----------------------------

// router.post("/get-backend-value-route", requireAuth, getBackendValueController);

// router.post(updateDisplayDataRoute, requireAuth, updateDisplayDataController);

//-----------------------------

// router.post(adminDataRoute, requireAdminAuth, adminDataController);

// //send data to scraper
// router.post(adminCommandRoute, requireAdminAuth, adminCommandController);

// //poll backend
// router.post(adminPollingRoute, requireAdminAuth, adminPollingController);

// router.use("/admin", requireAdminAuth, adminDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
