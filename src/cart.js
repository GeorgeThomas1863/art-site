import dbModel from "../models/db-model.js";
import { validatePositiveInt, sanitizeMongoValue } from "./sanitize.js";

export const buildCart = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

export const addCartItem = async (req) => {
  await buildCart(req);

  const { productId, quantity } = req.body.data;

  // Validate inputs
  const safeProductId = sanitizeMongoValue(productId);
  const safeQuantity = validatePositiveInt(quantity);
  if (!safeProductId || !safeQuantity) {
    return { success: false, message: "Invalid product ID or quantity" };
  }

  // Look up the real product from DB to get trusted price
  const productModel = new dbModel({ keyToLookup: "productId", itemValue: safeProductId }, process.env.PRODUCTS_COLLECTION);
  const productData = await productModel.getUniqueItem();
  if (!productData) return { success: false, message: "Product not found" };

  let existingItem = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].productId !== safeProductId) continue;

    existingItem = req.session.cart[i];
    break;
  }

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  // Update quantity if already exists
  if (existingItem) {
    existingItem.quantity += safeQuantity;
    existingItem.price = productData.price; // Always use DB price
  } else {
    // Build cart item from DB data — never trust client-supplied price
    const cartItem = {
      productId: safeProductId,
      name: productData.name,
      price: productData.price,
      quantity: safeQuantity,
      picData: productData.picData,
      canShip: productData.canShip,
      weight: productData.weight,
      length: productData.length,
      width: productData.width,
      height: productData.height,
    };
    req.session.cart.push(cartItem);
  }

  return { success: true, cart: req.session.cart, itemCount: itemCount };
};

export const getCartStats = async (req) => {
  await buildCart(req);

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  let total = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    total += req.session.cart[i].price * req.session.cart[i].quantity;
  }

  return { itemCount, total, success: true };
};

export const updateCartItem = async (req) => {
  const { quantity, productId } = req.body;
  await buildCart(req);

  let item = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].productId !== productId) continue;

    item = req.session.cart[i];
    break;
  }

  if (!item) {
    return res.json({ success: true, cart: req.session.cart });
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    let newCart = [];
    for (let i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].productId !== productId) {
        newCart.push(req.session.cart[i]);
      }
    }
    req.session.cart = newCart;
  } else {
    item.quantity = quantity;
  }

  return { success: true, cart: req.session.cart };
};

export const removeCartItem = async (req) => {
  const { productId } = req.body;
  if (!productId) return { success: false, error: "No product ID" };
  await buildCart(req);

  let newCart = [];
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].productId !== productId) {
      newCart.push(req.session.cart[i]);
    }
  }
  req.session.cart = newCart;

  return { success: true, cart: req.session.cart };
};
