import { sendToBack } from "../util/api-front.js";
import { buildCheckoutItem } from "../forms/checkout-form.js";
import { buildSquarePayment, tokenizePaymentMethod } from "./square-payment.js";
import { getCustomerParams } from "../util/params.js";
import { buildConfirmItem } from "../forms/confirm-form.js";

//main purchase function
export const runPlaceOrder = async () => {
  console.log("RUN PLACE ORDER");

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

    if (data && data.success) {
      console.log("DATA SUCCESS");
      console.log(data);

      //claude suggestion for storing the returned data
      sessionStorage.setItem("orderData", JSON.stringify(data));

      // Redirect to success page
      window.location.href = `/confirm-order`;
    } else {
      const errorContainer = document.getElementById("payment-error");
      if (errorContainer) {
        errorContainer.textContent = data.message || "Order processing failed";
        errorContainer.style.display = "block";
      }
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    }
  } catch (error) {
    console.error("Error processing order:", error);
    const errorContainer = document.getElementById("payment-error");
    if (errorContainer) {
      errorContainer.textContent = "An error occurred. Please try again.";
      errorContainer.style.display = "block";
    }
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place Order";
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
