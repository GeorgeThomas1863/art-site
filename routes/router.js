import express from "express";

import { mainDisplay, productsDisplay, aboutDisplay, eventsDisplay, cartDisplay, display404, display500, display401 } from "../controllers/display-controller.js"; //prettier-ignore
import { getProductDataController } from "../controllers/data-controller.js"; //prettier-ignore

const router = express.Router();

//------------------------

router.get("/get-product-data-route", getProductDataController);

router.get("/cart", cartDisplay);

router.get("/events", eventsDisplay);

router.get("/about", aboutDisplay);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.get("/401", display401);

router.use(display404);

router.use(display500);

export default router;
