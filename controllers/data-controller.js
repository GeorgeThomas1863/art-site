import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";
import { runAddNewEvent, runEditEvent, runDeleteEvent, runGetEventData } from "../src/events.js";
import { runContactSubmit } from "../src/contact.js";
import { runAddSubscriber, runGetSubscribers, runRemoveSubscriber, runSendNewsletter } from "../src/newsletter.js";
import { buildCart, runGetCartStats, runAddToCart, runUpdateCartItem, runRemoveFromCart } from "../src/cart.js";
import {
  runCalculateShipping,
  getShippingFromSession,
  saveShippingToSession,
  clearShippingFromSession,
  updateSelectedRate,
} from "../src/shipping.js";
import { placeNewOrder } from "../src/orders.js";
import { runDeletePic } from "../src/upload-back.js";
import {
  validateEmail,
  validateZip,
  validateString,
  validatePositiveInt,
  sanitizeMongoValue,
  whitelistFields,
  sanitizeFilename,
} from "../src/sanitize.js";

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

  // Validate filename contains no path separators or traversal
  const safeName = sanitizeFilename(filename);
  if (!safeName || safeName !== filename) return res.status(400).json({ error: "Invalid filename" });

  try {
    const data = await runDeletePic(safeName);
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

  const safeParams = whitelistFields(inputParams, ["name", "productType", "price", "canShip", "length", "width", "height", "weight", "description", "display", "sold", "picData", "dateCreated"]);
  const data = await runAddNewProduct(safeParams);
  return res.json(data);
};

export const editProductControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const safeParams = whitelistFields(inputParams, ["name", "productType", "price", "canShip", "length", "width", "height", "weight", "description", "display", "sold", "picData", "productId"]);
  const data = await runEditProduct(safeParams);
  return res.json(data);
};

export const deleteProductControl = async (req, res) => {
  const productId = req.body.productId;
  if (!productId) return res.status(500).json({ error: "No product ID" });
  if (typeof productId === "object") return res.status(400).json({ error: "Invalid product ID" });

  const data = await runDeleteProduct(productId);
  return res.json(data);
};

export const addNewEventControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const safeParams = whitelistFields(inputParams, ["name", "eventDate", "eventLocation", "eventDescription", "picData", "dateCreated"]);
  const data = await runAddNewEvent(safeParams);
  return res.json(data);
};

export const editEventControl = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const safeParams = whitelistFields(inputParams, ["name", "eventDate", "eventLocation", "eventDescription", "picData", "eventId"]);
  const data = await runEditEvent(safeParams);
  return res.json(data);
};

export const deleteEventControl = async (req, res) => {
  const eventId = req.body.eventId;
  if (!eventId) return res.status(500).json({ error: "No event ID" });
  if (typeof eventId === "object") return res.status(400).json({ error: "Invalid event ID" });

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

  const { productId, quantity } = req.body.data;
  if (typeof productId === "object") return res.status(400).json({ error: "Invalid product ID" });
  if (!validatePositiveInt(quantity)) return res.status(400).json({ error: "Invalid quantity" });

  const data = await runAddToCart(req);
  if (!data || !data.success) return res.status(500).json({ error: data?.message || "Failed to add item to cart" });

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

  if (!validateZip(req.body.zip)) return res.status(400).json({ error: "Invalid ZIP code format" });

  const data = await runCalculateShipping(req);
  if (!data || !data.success) return res.status(500).json({ error: data?.message || "Failed to calculate shipping" });

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

export const updateSelectedRateControl = async (req, res) => {
  if (!req || !req.body || !req.body.selectedRate) {
    return res.status(400).json({ error: "No selected rate provided" });
  }

  const data = await updateSelectedRate(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to update selected rate" });

  return res.json(data);
};

//-----------------

//ORDERS CONTROLLER

export const placeOrderControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.paymentToken) return res.status(500).json({ error: "No payment token" });

  // Validate customer fields
  const { firstName, lastName, email, address, city, state, zip } = req.body;
  if (!validateString(firstName, 100) || !validateString(lastName, 100)) return res.status(400).json({ error: "Invalid name" });
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!validateString(address, 200)) return res.status(400).json({ error: "Invalid address" });
  if (!validateString(city, 100)) return res.status(400).json({ error: "Invalid city" });
  if (!validateString(state, 50)) return res.status(400).json({ error: "Invalid state" });
  if (!validateZip(zip)) return res.status(400).json({ error: "Invalid ZIP code" });

  const data = await placeNewOrder(req);

  //json throws error with "bigint" type, converting to numbers
  const jsonData = JSON.parse(JSON.stringify(data, (key, value) => (typeof value === "bigint" ? Number(value) : value)));

  return res.json(jsonData);
};

//-----------

//CONTACT CONTROLLER

export const contactSubmitControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const { name, email, subject, message } = req.body;
  if (!validateString(name, 100)) return res.status(400).json({ error: "Invalid name" });
  if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!validateString(subject, 200)) return res.status(400).json({ error: "Invalid subject" });
  if (!validateString(message, 5000)) return res.status(400).json({ error: "Invalid message" });

  const data = await runContactSubmit(req.body);
  if (!data || !data.success) return res.status(500).json({ error: data?.message || "Failed to submit contact form" });

  return res.json(data);
};

export const addSubscriberControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.email) return res.status(500).json({ error: "No email provided" });
  if (!validateEmail(req.body.email)) return res.status(400).json({ error: "Invalid email format" });

  const data = await runAddSubscriber(req.body.email);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to add email to newsletter" });

  return res.json(data);
};

export const getSubscribersControl = async (req, res) => {
  const data = await runGetSubscribers();
  return res.json(data);
};

export const sendNewsletterControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });
  if (!req.body.subject || !req.body.message) return res.status(500).json({ error: "No subject or message provided" });

  const data = await runSendNewsletter(req.body);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to send newsletter" });

  return res.json(data);
};

export const removeSubscriberControl = async (req, res) => {
  if (!req || !req.body) return res.status(500).json({ error: "No input parameters" });

  const data = await runRemoveSubscriber(req.body.email);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to remove subscriber" });

  return res.json(data);
};
