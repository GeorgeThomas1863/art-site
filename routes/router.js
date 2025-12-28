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
  uploadPicController,
  addNewProductController,
  editProductController,
  deleteProductController,
  getProductDataController,
  getCartData,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
} from "../controllers/data-controller.js";

const router = express.Router();

// Login AUTH route
router.post("/site-auth-route", authController);

router.get("/401", display401);

//------------------------

//ADMIN ROUTES
router.get("/admin", requireAuth, adminDisplay);

router.post("/upload-pic-route", requireAuth, upload.single("image"), uploadPicController);

router.post("/add-new-product-route", requireAuth, addNewProductController);

router.post("/edit-product-route", requireAuth, editProductController);

router.post("/delete-product-route", requireAuth, deleteProductController);

//------------------------

//CART ROUTES
router.get("/cart/data", getCartData);

router.post("/cart/add", addToCart);

router.put("/cart/update/:productId", updateCartItem);

router.delete("/cart/remove/:productId", removeFromCart);

router.delete("/cart/clear", clearCart);

router.get("/cart/summary", getCartSummary);

//---------------------

//Main routes
router.get("/get-product-data-route", getProductDataController);

router.get("/cart", cartDisplay);

router.get("/events", eventsDisplay);

router.get("/about", aboutDisplay);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
