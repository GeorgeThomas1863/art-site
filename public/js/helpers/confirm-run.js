import { sendToBack } from "../util/api-front.js";
import { buildConfirmItem } from "../forms/confirm-form.js";

export const populateConfirmOrder = async () => {
  // Get order data from sessionStorage
  const orderDataStr = sessionStorage.getItem("orderData");

  if (!orderDataStr) {
    console.error("No order data found");
    window.location.href = "/";
    return null;
  }

  const data = JSON.parse(orderDataStr);

  sessionStorage.removeItem("orderData");

  await displayOrderDetails(data);
  await displayOrderItems(data);

  return true;
};

export const displayOrderDetails = async (orderData) => {
  if (!orderData) return null;

  const { orderId, orderDate, paymentStatus, customerData, itemCost, tax, totalCost } = orderData;

  // Order Number
  const orderNumberElement = document.getElementById("order-number");
  if (orderNumberElement) {
    orderNumberElement.textContent = orderId;
  }

  // Order Date
  const orderDateElement = document.getElementById("order-date");
  if (orderDateElement) {
    const date = new Date(orderDate);
    orderDateElement.textContent = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Payment Status
  const paymentStatusElement = document.getElementById("payment-status");
  if (paymentStatusElement) {
    paymentStatusElement.textContent = paymentStatus || "Completed";
    paymentStatusElement.style.color = "#22c55e";
    paymentStatusElement.style.fontWeight = "500";
  }

  // Customer Email
  const emailElement = document.getElementById("customer-email");
  if (emailElement) {
    emailElement.textContent = customerData.email;
  }

  // Shipping Address
  const shippingAddressElement = document.getElementById("shipping-address");
  if (shippingAddressElement) {
    const { firstName, lastName, address, city, state, zip } = customerData;
    shippingAddressElement.innerHTML = `
      ${firstName} ${lastName}<br>
      ${address}<br>
      ${city}, ${state} ${zip}
    `;
  }

  // Order Summary
  const subtotalElement = document.getElementById("confirm-subtotal");
  if (subtotalElement) {
    subtotalElement.textContent = `$${itemCost.toFixed(2)}`;
  }

  const taxElement = document.getElementById("confirm-tax");
  if (taxElement) {
    taxElement.textContent = `$${tax.toFixed(2)}`;
  }

  const totalElement = document.getElementById("confirm-total");
  if (totalElement) {
    totalElement.textContent = `$${totalCost.toFixed(2)}`;
  }

  return true;
};

export const displayOrderItems = async (orderData) => {
  if (!orderData || !orderData.items) return null;

  const itemsContainer = document.getElementById("confirm-items-container");
  if (!itemsContainer) {
    console.error("Confirmation items container not found");
    return null;
  }

  // Clear existing items
  itemsContainer.innerHTML = "";

  // Build and append confirmation items
  for (let i = 0; i < orderData.items.length; i++) {
    const item = orderData.items[i];
    const confirmItem = await buildConfirmItem(item);
    itemsContainer.append(confirmItem);
  }

  return true;
};
