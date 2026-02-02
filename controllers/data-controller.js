import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";
import { runAddNewEvent, runEditEvent, runDeleteEvent, runGetEventData } from "../src/events.js";
import { runContactSubmit } from "../src/contact.js";
import { runAddToNewsletter } from "../src/newsletter.js";
import { buildCart, runGetCartStats, runAddToCart, runUpdateCartItem, runRemoveFromCart } from "../src/cart.js";
import { runCalculateShipping, getShippingFromSession, saveShippingToSession, clearShippingFromSession } from "../src/shipping.js";
import { placeNewOrder } from "../src/orders.js";
import { runDeletePic } from "../src/upload-back.js";

//returns data for all products
export const getProductDataControl = async (req, res) => {
  const data = await runGetProductData();
  return res.json(data);
};

export const getEventDataControl = async (req, res) => {
  const data = await runGetEventData();
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

export const deletePicControl = async (req, res) => {
  const filename = req.body.filename;
  if (!filename) return res.status(400).json({ error: "No filename provided" });

  try {
    const data = await runDeletePic(filename);
    if (!data || !data.success) return res.status(500).json({ error: data.message });

    return res.json(data);
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
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

export const addNewEventControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddNewEvent(inputParams);
  return res.json(data);
};

export const editEventControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runEditEvent(inputParams);
  return res.json(data);
};

export const deleteEventControl = async (req, res) => {
  const eventId = req.body.eventId;
  if (!eventId) return res.status(500).json({ error: "No event ID" });

  const data = await runDeleteEvent(eventId);
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

//SHIPPING CONTROLLER

export const getShippingControl = async (req, res) => {
  const data = await getShippingFromSession(req);

  if (!data || !data.success) {
    return res.json({ success: false, shipping: null });
  }

  return res.json(data);
};

export const calculateShippingControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.zip) return res.status(500).json({ error: "No ZIP code provided" });

  // console.log("ZIP");
  // console.log(req.body);

  const data = await runCalculateShipping(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to calculate shipping" });

  return res.json(data);
};

export const saveShippingControl = async (req, res) => {
  if (!req || !req.body || !req.body.shippingData) {
    return res.status(400).json({ error: "No shipping data provided" });
  }

  const data = await saveShippingToSession(req);
  if (!data || !data.success) {
    return res.status(500).json({ error: "Failed to save shipping data" });
  }

  return res.json(data);
};

export const clearShippingControl = async (req, res) => {
  const data = await clearShippingFromSession(req);
  return res.json(data);
};

//-----------------

//ORDERS CONTROLLER

export const placeOrderControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.paymentToken) return res.status(500).json({ error: "No payment token" });

  const data = await placeNewOrder(req);

  //json throws error with "bigint" type, converting to numbers
  const jsonData = JSON.parse(JSON.stringify(data, (key, value) => (typeof value === "bigint" ? Number(value) : value)));

  return res.json(jsonData);
};

//-----------

//CONTACT CONTROLLER

export const contactSubmitControl = async (req, res) => {
  console.log("CONTACT SUBMIT CONTROL");
  console.log("REQUEST BODY");
  console.log(req.body);
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await runContactSubmit(req.body);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to submit contact form" });

  return res.json(data);
};

export const addToNewsletterControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.email) return res.status(500).json({ error: "No email provided" });

  const data = await runAddToNewsletter(req.body.email);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to add email to newsletter" });

  return res.json(data);
};
