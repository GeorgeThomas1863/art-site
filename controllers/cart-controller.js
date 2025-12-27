//cart creation function
export const buildCart = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

//-------------------

//cart routes
export const getCart = async (req, res) => {
  await buildCart(req);
  res.json({ cart: req.session.cart });
};

export const addToCart = async (req, res) => {
  await buildCart(req);

  const { productId, quantity, name, price, image } = req.body;

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
    req.session.cart.push({
      productId,
      name,
      price,
      image,
      quantity,
    });
  }

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

  const { productId } = req.params;

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
  await buildCart(req);

  let itemCount = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    itemCount += req.session.cart[i].quantity;
  }

  let total = 0;
  for (let i = 0; i < req.session.cart.length; i++) {
    total += req.session.cart[i].price * req.session.cart[i].quantity;
  }

  res.json({ itemCount, total });
};
