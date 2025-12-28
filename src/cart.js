export const buildCart = async (req) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
};

export const runAddToCart = async (req) => {
  await buildCart(req);

  const { productId, quantity } = req.body.data;

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

  return { success: true, cart: req.session.cart, itemCount: itemCount };
};

export const runGetCartStats = async (req) => {
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

export const runUpdateCartItem = async (req) => {
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

  return { success: true, cart: req.session.cart };
};

export const runRemoveFromCart = async (req) => {
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
