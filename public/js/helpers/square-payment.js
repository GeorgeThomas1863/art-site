// square-payment.js

import { sendToBack } from "../util/api-front.js";

const PRODUCTION_SDK_URL = "https://web.squarecdn.com/v1/square.js";
const SANDBOX_SDK_URL = "https://sandbox.web.squarecdn.com/v1/square.js";
const SQUARE_SDK_MARKER = "data-square-sdk";

let card;
let payments;

// Injects the Square SDK script for the given environment and resolves once it has loaded.
// Guards against double-injection if a previous call already added the tag.
const loadSquareSdk = async (squareEnv) => {
  if (window.Square) return true;

  const existingScript = document.querySelector(`script[${SQUARE_SDK_MARKER}]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => reject(new Error("Square.js failed to load")));
    });
  }

  const sdkUrl = squareEnv === "sandbox" ? SANDBOX_SDK_URL : PRODUCTION_SDK_URL;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.setAttribute(SQUARE_SDK_MARKER, "true");
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Square.js failed to load"));
    document.head.appendChild(script);
  });
};

export const buildSquarePayment = async () => {
  // console.log("BUILD SQUARE PAYMENT");
  try {
    const config = await sendToBack({ route: "/api/square-config" }, "GET");
    if (!config || !config.appId || !config.locationId) {
      throw new Error("Failed to load Square configuration");
    }

    await loadSquareSdk(config.squareEnv);

    if (!window.Square) {
      throw new Error("Square.js failed to load properly");
    }

    payments = window.Square.payments(config.appId, config.locationId);

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
