import express from "express";

// import CONFIG from "../config/config.js";
import requireAuth from "../middleware/auth-config.js";
import { authController } from "../controllers/auth-controller.js";
import { upload } from "../src/upload-back.js";

import {
  mainDisplay,
  adminDisplay,
  productsDisplay,
  aboutDisplay,
  eventsDisplay,
  contactDisplay,
  cartDisplay,
  checkoutDisplay,
  confirmOrderDisplay,
  display404,
  display500,
  display401,
} from "../controllers/display-controller.js";

import {
  // getBackgroundPicsControl,
  uploadPicControl,
  deletePicControl,
  addNewProductControl,
  editProductControl,
  deleteProductControl,
  addNewEventControl,
  editEventControl,
  deleteEventControl,
  getProductDataControl,
  getEventDataControl,
  getCartDataControl,
  addToCartControl,
  updateCartItemControl,
  removeFromCartControl,
  clearCartControl,
  getCartStatsControl,
  placeOrderControl,
  calculateShippingControl,
  saveShippingControl,
  clearShippingControl,
  getShippingControl,
  updateSelectedRateControl,
  contactSubmitControl,
  addSubscriberControl,
  getSubscribersControl,
  sendNewsletterControl,
  removeSubscriberControl,
} from "../controllers/data-controller.js";

const router = express.Router();

// Login AUTH route
router.post("/site-auth-route", authController);

router.get("/401", display401);

//------------------------

//ADMIN ROUTES
router.get("/admin", requireAuth, adminDisplay);

router.post("/upload-product-pic-route", requireAuth, upload.single("image"), uploadPicControl);

router.post("/upload-event-pic-route", requireAuth, upload.single("image"), uploadPicControl);

router.post("/delete-pic-route", requireAuth, deletePicControl);

router.post("/add-new-product-route", requireAuth, addNewProductControl);

router.post("/edit-product-route", requireAuth, editProductControl);

router.post("/delete-product-route", requireAuth, deleteProductControl);

router.post("/add-new-event-route", requireAuth, addNewEventControl);

router.post("/edit-event-route", requireAuth, editEventControl);

router.post("/delete-event-route", requireAuth, deleteEventControl);

//------------------------

//CART ROUTES
router.get("/cart/data", getCartDataControl);

router.get("/cart/stats", getCartStatsControl);

router.post("/cart/add", addToCartControl);

router.post("/cart/update", updateCartItemControl);

router.post("/cart/remove", removeFromCartControl);

router.post("/cart/clear", clearCartControl);

//---------------------

//SHIPPING ROUTES
router.get("/shipping/data", getShippingControl);

router.post("/shipping/calculate", calculateShippingControl);

router.post("/shipping/save", saveShippingControl);

router.post("/shipping/clear", clearShippingControl);

router.post("/shipping/select", updateSelectedRateControl);

//--------------

//CONTACT ROUTES
router.post("/contact-submit", contactSubmitControl);

router.post("/newsletter/add", addSubscriberControl);

router.get("/newsletter/data", requireAuth, getSubscribersControl);

router.post("/newsletter/send", requireAuth, sendNewsletterControl);

router.post("/newsletter/remove", requireAuth, removeSubscriberControl);

//ORDER ROUTES
router.post("/checkout/place-order", placeOrderControl);

//-----------------

//Main routes
router.get("/get-product-data-route", getProductDataControl);

router.get("/get-event-data-route", getEventDataControl);

// router.get("/get-background-pics", getBackgroundPicsControl);

router.get("/confirm-order", confirmOrderDisplay);

router.get("/checkout", checkoutDisplay);

router.get("/contact", contactDisplay);

router.get("/cart", cartDisplay);

router.get("/events", eventsDisplay);

router.get("/about", aboutDisplay);

router.get("/products", productsDisplay);

router.get("/", mainDisplay);

router.use(display404);

router.use(display500);

export default router;
