import express from "express";

import requireAuth from "../middleware/auth-middle.js";
import { authController } from "../controllers/auth-controller.js";
import { mainDisplay, adminDisplay, productsDisplay, aboutDisplay, eventsDisplay, cartDisplay, display404, display500, display401 } from "../controllers/display-controller.js"; //prettier-ignore

const router = express.Router();

router.post("/site-auth-route", authController);
router.get("/401", display401);

router.get("/admin", requireAuth, adminDisplay);

//------------------------

router.get("/cart", cartDisplay);

router.get("/events", eventsDisplay);

router.get("/about", aboutDisplay);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
