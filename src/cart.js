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
