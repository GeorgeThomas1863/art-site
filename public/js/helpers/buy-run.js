import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem, buildCheckoutShippingOption } from "../forms/checkout-form.js";
import { buildSquarePayment, tokenizePaymentMethod } from "./square-payment.js";
import { getCustomerParams } from "../util/params.js";
import { buildConfirmItem } from "../forms/confirm-form.js";
import { displayPopup } from "../util/popup.js";

//main purchase function
export const runPlaceOrder = async () => {
  // Validate customer info form
  const customerForm = document.getElementById("customer-info-form");
  if (!customerForm.checkValidity()) {
    customerForm.reportValidity();
    return null;
  }

  // Disable button to prevent double-clicks
  const placeOrderBtn = document.getElementById("checkout-place-order-btn");
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Processing...";

  try {
    // Get payment token from Square
    const paymentToken = await tokenizePaymentMethod();
    console.log("PAYMENT TOKEN");
    console.log(paymentToken);

    if (!paymentToken) {
      // Error already displayed by tokenizePaymentMethod
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
      return null;
    }

    // Gather customer data
    const customerParams = await getCustomerParams();
    customerParams.route = "/checkout/place-order";
    customerParams.paymentToken = paymentToken;

    console.log("CUSTOMER PARAMS");
    console.dir(customerParams);

    // Send to backend
    const data = await sendToBack(customerParams);
    console.log("DATA");
    console.dir(data);

    //fail
    if (!data || !data.success) {
      const errorContainer = document.getElementById("payment-error");
      if (!errorContainer) return null;

      errorContainer.textContent = data.message || "Order processing failed";
      errorContainer.style.display = "block";
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
      return null;
    }

    //store returned data and redirect
    sessionStorage.setItem("orderData", JSON.stringify(data));
    window.location.href = `/confirm-order`;
  } catch (e) {
    console.error("Error processing order:", e);
    const errorContainer = document.getElementById("payment-error");
    if (!errorContainer) return null;
    errorContainer.textContent = "An error occurred. Please try again.";
    errorContainer.style.display = "block";

    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place Order";
    return null;
  }

  return true;
};

//--------------------------------

// Load and display checkout data
export const populateCheckout = async () => {
  const data = await sendToBack({ route: "/cart/data" }, "GET");

  if (!data || !data.cart) {
    await displayPopup("Failed to load cart data for checkout", "error");
    window.location.href = "/cart";
    return null;
  }

  // If cart is empty, redirect
  if (data.cart.length === 0) {
    window.location.href = "/cart";
    return null;
  }

  await displayCheckoutItems(data.cart);
  await loadCheckoutShippingOptions();
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


export const loadCheckoutShippingOptions = async () => {
  const shippingContainer = document.getElementById("checkout-shipping-container");
  if (!shippingContainer) return null;

  // Clear existing content
  shippingContainer.innerHTML = "";

  const data = await sendToBack({ route: "/shipping/data" }, "GET");
  console.log("SHIPPING DATA");
  console.dir(data);

  if (!data || !data.shipping) {
    await displayPopup("Failed to get shipping data", "error");
    return null;
  }

  const { rateData, selectedRate } = data.shipping;

  if (!rateData || !rateData.length) {
    const noShippingMsg = document.createElement("div");
    noShippingMsg.className = "checkout-no-shipping";
    noShippingMsg.textContent = "Enter shipping address to calculate options";
    shippingContainer.append(noShippingMsg);
    return null;
  }

  // Sort by cost ascending (same as cart page)
  rateData.sort((a, b) => a.shipping_amount.amount - b.shipping_amount.amount);

  // Display shipping options
  for (let i = 0; i < rateData.length; i++) {
    const rate = rateData[i];
    const optionElement = await buildCheckoutShippingOption(rate);
    shippingContainer.append(optionElement);

    const radio = optionElement.querySelector("input[type='radio']");
    // Pre-select: either the saved selection OR the first (cheapest) option
    if (selectedRate && selectedRate.service_code === rate.service_code) {
      if (radio) radio.checked = true;
    } else if (i === 0 && !selectedRate) {
      if (radio) radio.checked = true;
    }
  }

  return true;
};

// Update checkout summary
export const updateCheckoutSummary = async () => {
  const subtotalElement = document.getElementById("checkout-subtotal");
  const shippingElement = document.getElementById("checkout-shipping");
  const taxElement = document.getElementById("checkout-tax");
  const totalElement = document.getElementById("checkout-total");
  //FIGURE OUT HOW TO FUCKING SELECT THIS !!!! 
  const zipElement = document.getElementById("zip"); 
  if (!subtotalElement || !shippingElement || !taxElement || !totalElement) return null;

  const cartData = await sendToBack({ route: "/cart/stats" }, "GET");

  if (!cartData) {
    await displayPopup("Failed to get cart summary", "error");
    return null;
  }

  subtotalElement.textContent = `$${cartData.total.toFixed(2)}`;

  const shippingData = await sendToBack({ route: "/shipping/data" }, "GET");
  let shippingCost = 0;

  if (shippingData && shippingData.selectedRate) {
    shippingCost = shippingData.selectedRate.shipping_amount.amount;
    shippingElement.textContent = `$${shippingCost.toFixed(2)}`;
    zipElement.input.value = shippingData.selectedRate.zip;
  } else {
    shippingElement.textContent = "[Input Zip Code]";
  }

  // Calculate tax HERE
  //maybe move to backend?
  const taxRate = 0.08;
  const tax = cartData.total * taxRate;
  taxElement.textContent = `$${tax.toFixed(2)}`;

  const finalTotal = cartData.total + tax + shippingCost;
  totalElement.textContent = `$${finalTotal.toFixed(2)}`;

  return true;
};

//------------------------------

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

  //clear cart on success
  if (data.orderData.paymentStatus === "COMPLETED") {
    await sendToBack({ route: "/cart/clear" });
  }

  return true;
};

export const displayOrderDetails = async (inputData) => {
  if (!inputData || !inputData.orderData || !inputData.customerData) return null;
  const { orderId, orderDate, paymentStatus, itemCost, tax, totalCost, receiptURL } = inputData.orderData;
  const { firstName, lastName, email, address, city, state, zip } = inputData.customerData;

  const formElements = {
    orderNumber: "order-number",
    orderDate: "order-date",
    paymentStatus: "payment-status",
    email: "customer-email",
    receiptLink: "receipt-link",
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
  obj.receiptLink.href = receiptURL;
  obj.receiptLink.style.display = "inline-block";

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
