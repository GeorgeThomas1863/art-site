import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";
import { buildSquarePayment, tokenizePaymentMethod } from "./square-payment.js";

// Load and display checkout data
export const populateCheckout = async () => {
  const data = await sendToBack({ route: "/cart/data" }, "GET");

  if (!data || !data.cart) {
    console.error("Failed to load cart data for checkout");
    // Redirect to cart if no items
    window.location.href = "/cart";
    return null;
  }

  // If cart is empty, redirect
  if (data.cart.length === 0) {
    window.location.href = "/cart";
    return null;
  }

  await displayCheckoutItems(data.cart);
  await updateCheckoutSummary();

  await buildSquarePayment();

  return true;
};

// Display checkout items
export const displayCheckoutItems = async (cartItems) => {
  const checkoutItemsContainer = document.getElementById("checkout-items-container");

  if (!checkoutItemsContainer) {
    console.error("Checkout items container not found");
    return null;
  }

  // Clear existing items
  checkoutItemsContainer.innerHTML = "";

  // Build and append checkout items
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const checkoutItem = await buildCheckoutItem(item);
    checkoutItemsContainer.append(checkoutItem);
  }

  return true;
};

// Update checkout summary
export const updateCheckoutSummary = async () => {
  const response = await sendToBack({ route: "/cart/stats" }, "GET");

  if (!response) {
    console.error("Failed to get cart summary");
    return null;
  }

  const { total } = response;

  // Update subtotal
  const subtotalElement = document.getElementById("checkout-subtotal");
  if (subtotalElement) {
    subtotalElement.textContent = `$${total.toFixed(2)}`;
  }

  // Calculate tax (example: 8% - you'll need to adjust this)
  const taxRate = 0.08;
  const tax = total * taxRate;

  const taxElement = document.getElementById("checkout-tax");
  if (taxElement) {
    taxElement.textContent = `$${tax.toFixed(2)}`;
  }

  // Update total (subtotal + tax for now, shipping TBD)
  const finalTotal = total + tax;
  const totalElement = document.getElementById("checkout-total");
  if (totalElement) {
    totalElement.textContent = `$${finalTotal.toFixed(2)}`;
  }

  return true;
};
