import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mainDisplay = async (req, res) => {
  res.sendFile(path.join(__dirname, "../html/index.html"));
};

export const adminDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/admin.html"));
};

export const productsDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/products.html"));
};

export const aboutDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/about.html"));
};

export const eventsDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/events.html"));
};

export const contactDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/contact.html"));
};

export const cartDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/cart.html"));
};

export const checkoutDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/checkout.html"));
};

export const confirmOrderDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/confirm-order.html"));
};

//------------------

export const display401 = (req, res) => {
  res.status(401).sendFile(path.join(__dirname, "../html/401.html"));
};

export const display404 = (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../html/404.html"));
};

export const display500 = (error, req, res, next) => {
  // console.log(error);
  res.status(500).sendFile(path.join(__dirname, "../html/500.html"));
};
