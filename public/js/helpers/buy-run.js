import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";
import { buildSquarePayment, tokenizePaymentMethod } from "./square-payment.js";
import { getCustomerParams } from "../util/params.js";
import { buildConfirmItem } from "../forms/confirm-form.js";
import { displayPopup } from "./popup.js";
import { updateCartSummary } from "./cart-run.js";

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

//---------------------

//SHIPPING
export const runCalculateShipping = async (clickElement) => {
  if (!clickElement) return null;

  const zipInput = document.getElementById("cart-shipping-zip-input");
  if (!zipInput) return null;

  const zip = zipInput.value.trim();

  console.log("ZIP");
  console.log(zip);

  // Validate ZIP
  if (!zip || zip.length !== 5 || !/^\d{5}$/.test(zip)) {
    await displayPopup("Please enter a valid 5-digit ZIP code", "error");
    return null;
  }

  // TODO: Call backend to calculate shipping
  // For now, mock response
  const data = await sendToBack({ route: "/checkout/calculate-shipping", zip: zip });
  console.log("DATA");
  console.dir(data);
  if (!data || !data.success || !data.distance) {
    const errorMsg = "Failed to calculate shipping cost. Please check your ZIP code and try again.";
    await displayPopup(errorMsg, "error");
    return null;
  }

  const shippingCost = await calculateDistanceCost(data.distance);
  if (!shippingCost) {
    const errorMsg = "Failed to calculate shipping cost. Please check your ZIP code and try again.";
    await displayPopup(errorMsg, "error");
    return null;
  }

  // Show result in calculator
  const resultDiv = document.getElementById("shipping-calculator-result");
  const resultValue = document.getElementById("shipping-result-value");
  if (resultDiv && resultValue) {
    resultValue.textContent = `$${shippingCost.toFixed(2)}`;
    resultDiv.style.display = "flex";
  }

  // Update summary shipping
  const shippingElement = document.getElementById("cart-summary-shipping");
  if (shippingElement) {
    shippingElement.textContent = `$${shippingCost.toFixed(2)}`;
  }

  await updateCartSummary(shippingCost);
  await displayPopup("Shipping calculated successfully", "success");

  return true;
};

export const calculateDistanceCost = async (distance) => {
  if (!distance) return null;

  if (distance > 1000) return 20;
  if (distance > 300) return 10;
  if (distance > 100) return 5;

  return 0;
};
