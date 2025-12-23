import express from "express";

// import CONFIG from "../config/config.js";
import requireAuth from "./auth.js";
import { authController } from "../controllers/auth-controller.js";
import { mainDisplay, adminDisplay, productsDisplay, display404, display500, display401 } from "../controllers/display-controller.js";
import { uploadPicController, addNewProductController, editProductController, deleteProductController, getProductDataController } from "../controllers/data-controller.js"; //prettier-ignore
import { upload } from "../src/upload-pic.js";

const router = express.Router();

// Login AUTH route
router.post("/site-auth-route", authController);

router.get("/401", display401);

router.get("/admin", requireAuth, adminDisplay);

router.post("/upload-pic-route", requireAuth, upload.single("image"), uploadPicController);

router.post("/add-new-product-route", requireAuth, addNewProductController);

router.post("/edit-product-route", requireAuth, editProductController);

router.post("/delete-product-route", requireAuth, deleteProductController);

//------------------------

router.get("/get-product-data-route", getProductDataController);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
