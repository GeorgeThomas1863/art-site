import { getCustomerParams } from "../util/params.js";

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
    const customerParams = await getCustomerParams();
    customerParams.route = "/checkout/place-order";
    customerParams.paymentToken = paymentToken;

    // Send to backend
    const data = await sendToBack(customerParams);
    console.log("DATA");
    console.log(data);

    if (data.success) {
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
