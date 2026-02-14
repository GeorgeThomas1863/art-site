import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem, buildCheckoutShippingOption } from "../forms/checkout-form.js";
import { buildSquarePayment, tokenizePaymentMethod } from "./square-payment.js";
import { getCustomerParams } from "../util/params.js";
import { buildConfirmItem } from "../forms/confirm-form.js";
import { displayPopup } from "../util/popup.js";
import { showLoadStatus, hideLoadStatus } from "../util/loading.js";

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

  const checkoutElement = document.getElementById("checkout-element");
  await showLoadStatus(checkoutElement, "Processing your order, should take 5-10 seconds");

  try {
    // Get payment token from Square
    const paymentToken = await tokenizePaymentMethod();
    console.log("PAYMENT TOKEN");
    console.log(paymentToken);

    if (!paymentToken) {
      // Error already displayed by tokenizePaymentMethod
      await hideLoadStatus();
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
    const orderData = await sendToBack(customerParams);
    console.log("RUN PLACE ORDER — ORDER DATA");
    console.dir(orderData);

    //fail
    if (!orderData || !orderData.success) {
      await hideLoadStatus();
      const errorContainer = document.getElementById("payment-error");
      if (!errorContainer) return null;

      errorContainer.textContent = data.message || "Order processing failed";
      errorContainer.style.display = "block";
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
      return null;
    }

    //store returned data and redirect
    await hideLoadStatus();
    sessionStorage.setItem("orderData", JSON.stringify(orderData));
    window.location.href = `/confirm-order`;
  } catch (e) {
    console.error("Error processing order:", e);
    await hideLoadStatus();
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
    if (selectedRate && selectedRate.rateId === rate.rateId) {
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
  const zipElement = document.getElementById("zip");
  if (!subtotalElement || !shippingElement || !taxElement || !totalElement || !zipElement) return null;

  const cartData = await sendToBack({ route: "/cart/stats" }, "GET");

  if (!cartData) {
    await displayPopup("Failed to get cart summary", "error");
    return null;
  }

  subtotalElement.textContent = `$${cartData.total.toFixed(2)}`;

  //move to backend later
  const taxRate = 0.08;
  const tax = cartData.total * taxRate;
  taxElement.textContent = `$${tax.toFixed(2)}`;

  const shippingData = await sendToBack({ route: "/shipping/data" }, "GET");

  let shippingCost = 0;
  if (shippingData && shippingData.shipping && shippingData.shipping.selectedRate) {
    shippingCost = shippingData.shipping.selectedRate.shipping_amount.amount;
    shippingElement.textContent = `$${shippingCost.toFixed(2)}`;
    zipElement.value = shippingData.shipping.zip;
  } else {
    shippingElement.textContent = "[Input ZIP Code]";
  }

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

  const orderData = JSON.parse(orderDataStr);

  console.log("POPULATE CONFIRM ORDER — ORDER DATA");
  console.dir(orderData);

  sessionStorage.removeItem("orderData");

  await displayOrderDetails(orderData.data);
  await displayOrderItems(orderData.data);

  return true;
};

export const displayOrderDetails = async (inputData) => {
  if (!inputData || !inputData.customerData) return null;
  const { orderId, receiptNumber, orderDate, paymentStatus, itemCost, shippingCost, tax, totalCost, receiptURL } = inputData;
  const { firstName, lastName, email, address, city, state, zip } = inputData.customerData;

  const formElements = {
    orderNumber: "order-number",
    orderDate: "order-date",
    paymentStatus: "payment-status",
    email: "customer-email",
    receiptLink: "receipt-link",
    shippingAddress: "shipping-address",
    shippingMethod: "shipping-method",
    estimatedDelivery: "estimated-delivery",
    subtotal: "confirm-subtotal",
    shipping: "confirm-shipping",
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

  obj.orderNumber.textContent = receiptNumber;

  obj.email.textContent = email;
  obj.subtotal.textContent = `$${itemCost.toFixed(2)}`;
  obj.shipping.textContent = `$${shippingCost.toFixed(2)}`;
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

  obj.shippingAddress.textContent = "";
  const addrLines = [`${firstName} ${lastName}`, address, `${city}, ${state} ${zip}`];
  addrLines.forEach((line, i) => {
    if (i > 0) obj.shippingAddress.appendChild(document.createElement("br"));
    obj.shippingAddress.appendChild(document.createTextNode(line));
  });

  if (inputData.shippingDetails) {
    const sd = inputData.shippingDetails;
    obj.shippingMethod.textContent = `${sd.carrier || ""} — ${sd.serviceType || ""}`;

    if (sd.estimatedDelivery) {
      const deliveryDate = new Date(sd.estimatedDelivery + "T00:00:00");
      obj.estimatedDelivery.textContent = deliveryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      obj.estimatedDelivery.textContent = "N/A";
    }
  }

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
