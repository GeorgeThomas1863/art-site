// square-payment.js

let card;
let payments;

export const buildSquarePayment = async () => {
  // console.log("BUILD SQUARE PAYMENT");
  if (!window.Square) {
    throw new Error("Square.js failed to load properly");
  }

  try {
    // Initialize Square Payments
    payments = window.Square.payments(
      "sandbox-sq0idb-47M2yMYCAcisSRPLrPzRzA", // You'll get this from Square Dashboard
      "LMD9YKFJWX7P0" // You'll get this from Square Dashboard
    );

    // Initialize Card payment method
    card = await payments.card();
    await card.attach("#card-container");

    // console.log("Square payment form initialized");
    return true;
  } catch (error) {
    console.error("Failed to initialize Square payment:", error);
    displayPaymentError("Failed to load payment form. Please refresh the page.");
    return false;
  }
};

export const tokenizePaymentMethod = async () => {
  const errorContainer = document.getElementById("payment-error");

  // Clear any previous errors
  if (errorContainer) {
    errorContainer.style.display = "none";
    errorContainer.textContent = "";
  }

  try {
    const result = await card.tokenize();

    if (result.status === "OK") {
      return result.token;
    } else {
      let errorMessage = "Payment processing failed.";

      if (result.errors && result.errors.length > 0) {
        errorMessage = result.errors[0].message;
      }

      displayPaymentError(errorMessage);
      return null;
    }
  } catch (error) {
    console.error("Tokenization error:", error);
    displayPaymentError("An error occurred. Please try again.");
    return null;
  }
};

const displayPaymentError = (message) => {
  const errorContainer = document.getElementById("payment-error");
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
  }
};
