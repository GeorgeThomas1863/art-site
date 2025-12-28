// helpers/cart-run.js
// import { sendToBackGET, sendToBackPOST, sendToBackPUT, sendToBackDELETE } from "../util/api-front.js";
import { sendToBack } from "../util/api-front.js";
import { buildCartItem, buildEmptyCart } from "../forms/cart-form.js";
import { displayPopup } from "./popup.js";

export const runAddToCart = async (clickElement) => {
  console.log("ADD TO CART CLICKED");
  console.log("Product ID:");
  console.log(clickElement);

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
    body: {
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

// Update navbar cart count
export const updateNavbarCart = async () => {
  const res = await sendToBack({ route: "/cart/summary" }, "GET");

  console.log("UPDATE NAVBAR CART RESPONSE:");
  console.log(res);

  if (!res || !res.success) return null;

  const { itemCount } = res;

  const cartContainer = document.getElementById("nav-cart-container");
  const cartCountElement = document.getElementById("nav-cart-count");

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

// Update cart summary (totals, item count)
export const updateCartSummary = async () => {
  const response = await sendToBack({ route: "/cart/summary" }, "GET");

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

  // Update total
  const totalElement = document.getElementById("cart-summary-total");
  if (totalElement) {
    totalElement.textContent = `$${total.toFixed(2)}`;
  }

  return true;
};

// Increase item quantity
export const increaseQuantity = async (productId) => {
  // Get current quantity
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (!quantityElement) return null;

  const currentQuantity = parseInt(quantityElement.textContent);
  const newQuantity = currentQuantity + 1;

  const response = await sendToBackPUT({
    route: `/cart/update/${productId}`,
    body: { quantity: newQuantity },
  });

  if (!response || !response.success) {
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

// Decrease item quantity
export const decreaseQuantity = async (productId) => {
  // Get current quantity
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (!quantityElement) return null;

  const currentQuantity = parseInt(quantityElement.textContent);

  if (currentQuantity <= 1) {
    // Remove item if quantity would be 0
    await removeFromCart(productId);
    return true;
  }

  const newQuantity = currentQuantity - 1;

  const response = await sendToBack(
    {
      route: `/cart/update/${productId}`,
      body: { quantity: newQuantity },
    },
    "PUT"
  );

  if (!response || !response.success) {
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

// Remove item from cart
export const removeFromCart = async (productId) => {
  const response = await sendToBack(
    {
      route: `/cart/remove/${productId}`,
    },
    "DELETE"
  );

  if (!response || !response.success) {
    await displayPopup("Failed to remove item", "error");
    return null;
  }

  // Remove item from DOM
  const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
  if (cartItem) {
    cartItem.remove();
  }

  // Check if cart is now empty
  const response2 = await sendToBack({ route: "/cart/data" }, "GET");
  if (response2 && response2.cart && response2.cart.length === 0) {
    await displayCart([]);
  }

  await updateCartSummary();
  await updateNavbarCart();
  await displayPopup("Item removed from cart", "success");

  return true;
};
