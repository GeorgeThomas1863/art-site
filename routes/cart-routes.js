import express from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartSummary } from "../controllers/cart-controller.js";

const router = express.Router();

// GET cart contents
router.get("/cart", getCart);

// ADD item to cart
router.post("/cart/add", addToCart);

// UPDATE item quantity
router.put("/cart/update/:productId", updateCartItem);

// REMOVE item from cart
router.delete("/cart/remove/:productId", removeFromCart);

// CLEAR entire cart
router.delete("/cart/clear", clearCart);

// GET cart summary
router.get("/cart/summary", getCartSummary);

export default router;
