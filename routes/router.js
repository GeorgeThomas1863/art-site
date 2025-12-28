import express from "express";

// import CONFIG from "../config/config.js";
import requireAuth from "../middleware/auth-middle.js";
import { authController } from "../controllers/auth-controller.js";
import { upload } from "../src/upload-pic.js";

import {
  mainDisplay,
  adminDisplay,
  productsDisplay,
  cartDisplay,
  aboutDisplay,
  eventsDisplay,
  display404,
  display500,
  display401,
} from "../controllers/display-controller.js";

import {
  uploadPicControl,
  addNewProductControl,
  editProductControl,
  deleteProductControl,
  getProductDataControl,
  getCartDataControl,
  addToCartControl,
  updateCartItemControl,
  removeFromCartControl,
  clearCartControl,
  getCartStatsControl,
} from "../controllers/data-controller.js";

const router = express.Router();

// Login AUTH route
router.post("/site-auth-route", authController);

router.get("/401", display401);

//------------------------

//ADMIN ROUTES
router.get("/admin", requireAuth, adminDisplay);

router.post("/upload-pic-route", requireAuth, upload.single("image"), uploadPicControl);

router.post("/add-new-product-route", requireAuth, addNewProductControl);

router.post("/edit-product-route", requireAuth, editProductControl);

router.post("/delete-product-route", requireAuth, deleteProductControl);

//------------------------

//CART ROUTES
router.get("/cart/data", getCartDataControl);

router.post("/cart/add", addToCartControl);

router.put("/cart/update/:productId", updateCartItemControl);

router.delete("/cart/remove/:productId", removeFromCartControl);

router.delete("/cart/clear", clearCartControl);

router.get("/cart/stats", getCartStatsControl);

//---------------------

//Main routes
router.get("/get-product-data-route", getProductDataControl);

router.get("/cart", cartDisplay);

router.get("/events", eventsDisplay);

router.get("/about", aboutDisplay);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
