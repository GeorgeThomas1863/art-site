import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";

//returns data for all products
export const getProductDataController = async (req, res) => {
  const data = await runGetProductData();
  return res.json(data);
};

export const uploadPicController = async (req, res) => {
  // console.log("AHHHH");
  // console.log(req.file);

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

export const addNewProductController = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddNewProduct(inputParams);
  return res.json(data);
};

export const editProductController = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runEditProduct(inputParams);
  return res.json(data);
};

export const deleteProductController = async (req, res) => {
  const productId = req.body.productId;
  if (!productId) return res.status(500).json({ error: "No product ID" });

  const data = await runDeleteProduct(productId);
  return res.json(data);
};

//---------------------

//CART controller
export const buildCart = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

//cart routes
export const getCartData = async (req, res) => {
  await buildCart(req);
  res.json({ cart: req.session.cart });
};

export const addToCart = async (req, res) => {
  await buildCart(req);

  const { productId, quantity, name, price, image } = req.body.data;

  let existingItem = null;
  for (let i = 0; i < req.session.cart.length; i++) {
    if (req.session.cart[i].productId !== productId) continue;

    existingItem = req.session.cart[i];
    break;
  }

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  // Update quantity if already exists
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    // Add new item
    req.session.cart.push(req.body.data);
  }

  console.log("ADD TO CART");
  console.log(req.session.cart);

  res.json({
    success: true,
    cart: req.session.cart,
    itemCount: itemCount,
  });
};

export const updateCartItem = async (req, res) => {
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
export const removeFromCart = async (req, res) => {
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
export const clearCart = async (req, res) => {
  req.session.cart = [];
  res.json({ success: true, cart: [] });
};

// GET cart summary (item count, total)
export const getCartSummary = async (req, res) => {
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
