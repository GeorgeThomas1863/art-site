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

//--------

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

    if (!paymentToken) {
      // Error already displayed by tokenizePaymentMethod
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
      return null;
    }

    // Gather customer data
    const customerData = {
      firstName: document.getElementById("first-name").value,
      lastName: document.getElementById("last-name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      zip: document.getElementById("zip").value,
    };

    // Send to backend
    const response = await sendToBack(
      {
        route: "/checkout/process",
        body: {
          paymentToken: paymentToken,
          customerData: customerData,
        },
      },
      "POST"
    );

    if (response.success) {
      // Redirect to success page
      window.location.href = `/order-confirmation/${response.orderId}`;
    } else {
      const errorContainer = document.getElementById("payment-error");
      if (errorContainer) {
        errorContainer.textContent = response.message || "Order processing failed";
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
