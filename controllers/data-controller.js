import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";
import { buildCart, runAddToCart } from "../src/cart.js";

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
  console.log("GET CART SUMMARY");
  console.log(req.session.cart);
  await buildCart(req);

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  let total = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    total += req.session.cart[i].price * req.session.cart[i].quantity;
  }

  res.json({ itemCount, total, success: true });
};

export const addToCartControl = async (req, res) => {
  if (!req || !req.body || !req.body.data) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddToCart(req);
  if (!data || !data.success) return res.status(500).json({ error: "Failed to add item to cart" });

  res.json(data);
};

export const updateCartItemControl = async (req, res) => {
  await buildCart(req);

  const { productId } = req.params;
  const { quantity } = req.body;

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

  res.json({ success: true, cart: req.session.cart });
};

// REMOVE item from cart
export const removeFromCartControl = async (req, res) => {
  await buildCart(req);

  let newCart = [];
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].productId !== productId) {
      newCart.push(req.session.cart[i]);
    }
  }
  req.session.cart = newCart;

  res.json({ success: true, cart: req.session.cart });
};

// CLEAR entire cart
export const clearCartControl = async (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
};
