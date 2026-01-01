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

  obj.orderNumber.textContent = orderId;

  obj.email.textContent = email;
  obj.subtotal.textContent = `$${itemCost.toFixed(2)}`;
  obj.tax.textContent = `$${tax.toFixed(2)}`;
  obj.total.textContent = `$${totalCost.toFixed(2)}`;

  obj.paymentStatus.textContent = paymentStatus || "Completed";
  obj.paymentStatus.style.color = "#22c55e";
  obj.paymentStatus.style.fontWeight = "500";

  console.log("ORDER DATE!!!");
  console.log(orderDate);

  obj.orderDate.textContent = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  obj.shippingAddress.innerHTML = `
      ${firstName} ${lastName}<br>
      ${address}<br>
      ${city}, ${state} ${zip}
    `;

  return true;
};

export const displayOrderItems = async (inputData) => {
  if (!inputData || !inputData.cartData) return null;
  const { cartData } = inputData;

  const itemsContainer = document.getElementById("confirm-items-container");
  if (!itemsContainer) {
    console.error("Confirmation items container not found");
    return null;
  }

  // Clear existing items
  itemsContainer.innerHTML = "";

  // Build and append confirmation items
  for (let i = 0; i < cartData.length; i++) {
    const item = cartData[i];
    const confirmItem = await buildConfirmItem(item);
    itemsContainer.append(confirmItem);
  }

  return true;
};
