import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";
import { buildCart, runGetCartStats, runAddToCart, runUpdateCartItem, runRemoveFromCart } from "../src/cart.js";
import { runPlaceOrder } from "../src/orders.js";

//returns data for all products
export const getProductDataControl = async (req, res) => {
  const data = await runGetProductData();
  return res.json(data);
};

export const uploadPicControl = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const data = {
    message: "Picture uploaded successfully",
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
  };

  return res.json(data);
};

export const addNewProductControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddNewProduct(inputParams);
  return res.json(data);
};

export const editProductControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runEditProduct(inputParams);
  return res.json(data);
};

export const deleteProductControl = async (req, res) => {
  const productId = req.body.productId;
  if (!productId) return res.status(500).json({ error: "No product ID" });

  const data = await runDeleteProduct(productId);
  return res.json(data);
};

//---------------------

//CART CONTROLLER

export const getCartDataControl = async (req, res) => {
  await buildCart(req);
  res.json({ cart: req.session.cart });
};

export const getCartStatsControl = async (req, res) => {
  if (!req || !req.session || !req.session.cart) return res.status(500).json({ error: "No cart data" });

  const data = await runGetCartStats(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to get cart stats" });

  res.json(data);
};

export const addToCartControl = async (req, res) => {
  if (!req || !req.body || !req.body.data) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddToCart(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to add item to cart" });

  res.json(data);
};

export const updateCartItemControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await runUpdateCartItem(req);
  console.log("UPDATE CART ITEM DATA:");
  console.log(data);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to update cart item" });

  res.json(data);
};

// REMOVE item from cart
export const removeFromCartControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await runRemoveFromCart(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to remove item from cart" });

  res.json(data);
};

// CLEAR entire cart
export const clearCartControl = async (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
};

//-----------------------

//ORDERS CONTROLLER

export const placeOrderControl = async (req, res) => {
  console.log("PLACE ORDER CONTROLLER");
  console.log("REQ BODY");
  console.dir(req.body);
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.paymentToken) return res.status(500).json({ error: "No payment token" });

  const data = await runPlaceOrder(req);
  return res.json(data);
};
