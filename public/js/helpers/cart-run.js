import { sendToBack } from "../util/api-front.js";
import { buildCartItem, buildEmptyCart } from "../forms/cart-form.js";
import { displayPopup } from "../util/popup.js";

export const runAddToCart = async (clickElement) => {
  if (!clickElement) return null;
  // console.log("ADD TO CART CLICKED");
  // console.log("Product ID:");
  // console.log(clickElement);

  const productId = clickElement.productId;

  // Find product data from the DOM //UNFUCK THIS
  const productCard = document.querySelector(`[data-product-id="${productId}"]`);
  if (!productCard) {
    console.error("Product card not found");
    return null;
  }

  const name = productCard.querySelector(".product-name")?.textContent;
  const priceText = productCard.querySelector(".product-price")?.textContent;
  const price = priceText ? parseFloat(priceText.replace("$", "")) : 0;
  const image = productCard.querySelector(".product-image")?.src;

  const res = await sendToBack({
    route: "/cart/add",
    data: {
      productId,
      name,
      price,
      image,
      quantity: 1,
    },
  });

  console.log("ADD TO CART RES:");
  console.log(res);

  if (!res || !res.success) {
    await displayPopup("Failed to add item to cart", "error");
    return null;
  }

  console.log("ITEM ADDED TO CART");

  await displayPopup("Item added to cart!", "success");
  await updateNavbarCart();

  return true;
};

// Increase item quantity
export const runIncreaseQuantity = async (clickElement) => {
  if (!clickElement) return null;
  const productId = clickElement.dataset.productId;

  console.log("CLICK ELEMENT:");
  console.log(clickElement);

  console.log("INCREASE QUANTITY CLICKED");
  console.log("Product ID:");
  console.log(productId);

  // Get current quantity
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (!quantityElement) return null;

  const currentQuantity = parseInt(quantityElement.textContent);
  const newQuantity = currentQuantity + 1;

  console.log("CURRENT QUANTITY:");
  console.log(currentQuantity);

  console.log("NEW QUANTITY:");
  console.log(newQuantity);

  const params = {
    route: "/cart/update",
    quantity: newQuantity,
    productId: productId,
  };

  const res = await sendToBack(params);

  if (!res || !res.success) {
    await displayPopup("Failed to update quantity", "error");
    return null;
  }

  // Update display
  quantityElement.textContent = newQuantity;
  await updateItemTotal(productId, newQuantity);
  await updateCartSummary();
  await updateNavbarCart();

  return true;
};

export const runDecreaseQuantity = async (clickElement) => {
  if (!clickElement) return null;
  const productId = clickElement.dataset.productId;
  // Get current quantity
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (!quantityElement) return null;

  const currentQuantity = parseInt(quantityElement.textContent);

  if (currentQuantity <= 1) {
    // Remove item if quantity would be 0
    await runRemoveFromCart(clickElement);
    return true;
  }

  const newQuantity = currentQuantity - 1;

  const params = {
    route: "/cart/update",
    quantity: newQuantity,
    productId: productId,
  };

  const res = await sendToBack(params);

  if (!res || !res.success) {
    await displayPopup("Failed to update quantity", "error");
    return null;
  }

  // Update display
  quantityElement.textContent = newQuantity;
  await updateItemTotal(productId, newQuantity);
  await updateCartSummary();
  await updateNavbarCart();

  return true;
};

// Remove item from cart
export const runRemoveFromCart = async (clickElement) => {
  if (!clickElement) return null;
  const productId = clickElement.dataset.productId;

  const params = {
    route: "/cart/remove",
    productId: productId,
  };

  const res = await sendToBack(params);

  if (!res || !res.success) {
    await displayPopup("Failed to remove item", "error");
    return null;
  }

  // Remove item from DOM
  const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
  if (cartItem) {
    cartItem.remove();
  }

  // Check if cart is now empty
  const res2 = await sendToBack({ route: "/cart/data" }, "GET");
  if (res2 && res2.cart && res2.cart.length === 0) {
    await displayCart([]);
  }

  await updateCartSummary();
  await updateNavbarCart();
  await displayPopup("Item removed from cart", "success");

  return true;
};

//---------------------------

// Update navbar cart count
export const updateNavbarCart = async () => {
  const res = await sendToBack({ route: "/cart/stats" }, "GET");

  console.log("UPDATE NAVBAR CART RESPONSE:");
  console.log(res);

  if (!res || !res.success) return null;

  const { itemCount } = res;

  const cartContainer = document.getElementById("nav-cart-container");
  const cartCountElement = document.getElementById("nav-cart-count");
  console.log("CART CONTAINER:");
  console.log(cartContainer);
  console.log("CART COUNT ELEMENT:");
  console.log(cartCountElement);

  if (!cartContainer || !cartCountElement) return null;

  // Show/hide cart button based on item count
  if (itemCount > 0) {
    cartContainer.style.display = "block";
    cartCountElement.textContent = itemCount;
  } else {
    cartContainer.style.display = "none";
  }

  return true;
};

// Load and display cart
export const populateCart = async () => {
  const data = await sendToBack({ route: "/cart/data" }, "GET");

  if (!data || !data.cart) {
    console.error("Failed to load cart");
    return null;
  }

  await displayCart(data.cart);
  await updateCartSummary();

  return true;
};

// Display cart items
export const displayCart = async (cartItems) => {
  const cartItemsContainer = document.getElementById("cart-items-container");

  if (!cartItemsContainer) {
    console.error("Cart items container not found");
    return null;
  }

  // Clear existing items
  cartItemsContainer.innerHTML = "";

  // If cart is empty, show empty state
  if (!cartItems || cartItems.length === 0) {
    const emptyCart = await buildEmptyCart();
    cartItemsContainer.append(emptyCart);

    // Disable checkout button
    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
    }

    return true;
  }

  // Build and append cart items
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const cartItem = await buildCartItem(item);
    cartItemsContainer.append(cartItem);
  }

  // Enable checkout button if cart has items
  const checkoutBtn = document.getElementById("cart-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
  }

  return true;
};

// Update cart summary (totals, item count), remove param
export const updateCartSummary = async (shippingCost = 0) => {
  const response = await sendToBack({ route: "/cart/stats" }, "GET");

  if (!response) {
    console.error("Failed to get cart summary");
    return null;
  }

  const { itemCount, total } = response;

  // Update item count
  const itemCountElement = document.getElementById("cart-summary-item-count");
  if (itemCountElement) {
    itemCountElement.textContent = itemCount;
  }

  // Update subtotal
  const subtotalElement = document.getElementById("cart-summary-subtotal");
  if (subtotalElement) {
    subtotalElement.textContent = `$${total.toFixed(2)}`;
  }
  
  //can prob remove
  const finalTotal = total + shippingCost;

  // Update total
  const totalElement = document.getElementById("cart-summary-total");
  if (totalElement) {
    totalElement.textContent = `$${finalTotal.toFixed(2)}`;
  }

  return true;
};

// Decrease item quantity

// Update item total display
export const updateItemTotal = async (productId, quantity) => {
  const itemTotalElement = document.getElementById(`item-total-${productId}`);
  if (!itemTotalElement) return null;

  // Get price from cart item
  const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
  if (!cartItem) return null;

  const priceElement = cartItem.querySelector(".cart-item-price");
  if (!priceElement) return null;

  const priceText = priceElement.textContent;
  const price = parseFloat(priceText.replace("$", ""));

  const total = price * quantity;
  itemTotalElement.textContent = `$${total.toFixed(2)}`;

  return true;
};
