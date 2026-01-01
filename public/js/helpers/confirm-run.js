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

  console.log("DATA");
  console.dir(data);

  sessionStorage.removeItem("orderData");

  await displayOrderDetails(data);
  await displayOrderItems(data);

  return true;
};

export const displayOrderDetails = async (inputData) => {
  if (!inputData || !inputData.orderData || !inputData.customerData) return null;
  const { orderId, orderDate, paymentStatus, itemCost, tax, totalCost } = inputData.orderData;
  const { firstName, lastName, email, address, city, state, zip } = inputData.customerData;

  const formElements = {
    orderNumber: "order-number",
    orderDate: "order-date",
    paymentStatus: "payment-status",
    email: "customer-email",
    shippingAddress: "shipping-address",
    subtotal: "confirm-subtotal",
    tax: "confirm-tax",
    total: "confirm-total",
  };

  //ensure elements load, better way of doing this
  const obj = {};
  for (const key in formElements) {
    obj[key] = document.getElementById(formElements[key]);
    if (!obj[key]) {
      console.error(`ELEMENT FAILED TO LOAD: ${formElements[key]}`);
      return null;
    }
  }

  obj.orderNumberElement.textContent = orderId;
  obj.orderDateElement.textContent = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  obj.paymentStatusElement.textContent = paymentStatus || "Completed";
  obj.paymentStatusElement.style.color = "#22c55e";
  obj.paymentStatusElement.style.fontWeight = "500";

  obj.emailElement.textContent = email;

  obj.shippingAddressElement.innerHTML = `
      ${firstName} ${lastName}<br>
      ${address}<br>
      ${city}, ${state} ${zip}
    `;

  obj.subtotalElement.textContent = `$${itemCost.toFixed(2)}`;
  obj.taxElement.textContent = `$${tax.toFixed(2)}`;
  obj.totalElement.textContent = `$${totalCost.toFixed(2)}`;

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
