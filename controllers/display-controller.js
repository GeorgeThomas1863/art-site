import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dbModel from "../models/db-model.js";

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

export const newsletterDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/newsletter.html"));
};

let cachedProductsHtml = null;

export const displayProductBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const lookupParams = { keyToLookup: "urlName", itemValue: slug };
    const productModel = new dbModel(lookupParams, process.env.PRODUCTS_COLLECTION);
    const product = await productModel.getUniqueItem();

    if (!product || product.display === "no") {
      return res.redirect("/products");
    }

    if (!cachedProductsHtml) {
      cachedProductsHtml = await fs.promises.readFile(path.join(__dirname, "../html/products.html"), "utf8");
    }
    const htmlString = cachedProductsHtml;

    const escapeHtml = (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const description = (product.description || "").substring(0, 155);

    const firstPic = Array.isArray(product.picData)
      ? product.picData[0]?.filename
      : product.picData?.filename;

    let ogTags = `
  <meta property="og:title" content="${escapeHtml(product.name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="https://twosistersfiberart.com/products/${escapeHtml(slug)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />`;

    if (firstPic) {
      ogTags += `\n  <meta property="og:image" content="https://twosistersfiberart.com/images/products/${escapeHtml(firstPic)}" />`;
    }

    const modifiedHtml = htmlString.replace("</head>", ogTags + "\n</head>");

    const etag = `"${slug}"`;
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("ETag", etag);

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    return res.send(modifiedHtml);
  } catch (error) {
    console.error("Error in displayProductBySlug:", error);
    return res.redirect("/products");
  }
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
