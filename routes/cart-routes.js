import express from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartSummary } from "../controllers/cart-controller.js";

const router = express.Router();

// GET cart contents
router.get("/data/cart", getCart);

// ADD item to cart
router.post("/data/cart/add", addToCart);

// UPDATE item quantity
router.put("/data/cart/update/:productId", updateCartItem);

// REMOVE item from cart
router.delete("/data/cart/remove/:productId", removeFromCart);

// CLEAR entire cart
router.delete("/data/cart/clear", clearCart);

// GET cart summary
router.get("/data/cart/summary", getCartSummary);

export default router;
