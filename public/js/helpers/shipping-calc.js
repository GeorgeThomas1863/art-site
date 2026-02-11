import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { updateCartSummary } from "./cart-run.js";
import { loadCheckoutShippingOptions, updateCheckoutSummary } from "./buy-run.js";
import { buildShippingOption } from "../forms/cart-form.js";
import { showLoadStatus, hideLoadStatus } from "../util/loading.js";

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

  const cartElement = document.getElementById("cart-element");
  if (!cartElement) return null;
  await showLoadStatus(cartElement, "Calculating shipping rates, should take 5-10 seconds");

  try {
    const cartData = await sendToBack({ route: "/cart/data" }, "GET");
    if (!cartData) {
      await hideLoadStatus();
      await displayPopup("Failed to get cart data", "error");
      return null;
    }

    //product dimensions / weight calculated on backend
    const params = {
      route: "/shipping/calculate",
      zip: zip,
      productArray: cartData.cart,
    };

    const data = await sendToBack(params);
    if (!data || !data.rateData) {
      await hideLoadStatus();
      await displayPopup("Failed to calculate shipping rates from backend", "error");
      return null;
    }
    console.log("DATA");
    console.dir(data);

    const rateArray = data.rateData;

    // Rates are already adjusted by backend - just sort by cost
    rateArray.sort((a, b) => a.shipping_amount.amount - b.shipping_amount.amount);

    const resultContainer = document.getElementById("shipping-calculator-result");
    if (!resultContainer) {
      await hideLoadStatus();
      await displayPopup("Failed to get result container", "error");
      return null;
    }

    // Clear previous results
    resultContainer.innerHTML = "";

    // Add title
    const title = document.createElement("h4");
    title.className = "shipping-options-title";
    title.textContent = "Select Shipping Method:";
    resultContainer.appendChild(title);

    for (const rate of rateArray) {
      const optionElement = await buildShippingOption(rate);
      resultContainer.appendChild(optionElement);
    }

    // Show the container
    resultContainer.classList.remove("hidden");

    const firstRadio = resultContainer.querySelector('input[name="shipping-option"]');
    if (firstRadio) {
      firstRadio.checked = true;
      const cheapestCost = parseFloat(firstRadio.value);
      await updateCartSummary(cheapestCost);
    }

    await hideLoadStatus();

    await displayPopup("Shipping options loaded successfully", "success");
    return true;
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    await hideLoadStatus();
    await displayPopup("Failed to calculate shipping rates", "error");
    return null;
  }
};

// Debounced shipping calculation for checkout zip field
export const runCalculateShippingCheckout = async () => {
  const zipInput = document.getElementById("zip");
  if (!zipInput) return null;

  const zip = zipInput.value.trim();

  // Silently validate 5-digit zip (no popups while typing)
  if (!zip || zip.length !== 5 || !/^\d{5}$/.test(zip)) {
    return null;
  }

  const checkoutElement = document.getElementById("checkout-element");
  if (!checkoutElement) return null;
  await showLoadStatus(checkoutElement, "Calculating shipping rates, should take about 5-10 seconds");

  try {
    const cartData = await sendToBack({ route: "/cart/data" }, "GET");
    if (!cartData) {
      await hideLoadStatus();
      await displayPopup("Failed to get cart data", "error");
      return null;
    }

    //product dimensions / weight calculated on backend
    const params = {
      route: "/shipping/calculate",
      zip: zip,
      productArray: cartData.cart,
    };

    const data = await sendToBack(params);
    if (!data || !data.rateData) {
      await hideLoadStatus();
      await displayPopup("Failed to calculate shipping rates", "error");
      return null;
    }

    // Refresh shipping options UI and update totals
    await loadCheckoutShippingOptions();
    await updateCheckoutSummary();

    await hideLoadStatus();
    await displayPopup("Shipping rates calculated successfully", "success");

    return true;
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    await hideLoadStatus();
    await displayPopup("Failed to calculate shipping rates", "error");
    return null;
  }
};

//--------------------------------

export const runShippingOptionSelect = async (clickElement) => {
  if (!clickElement) return null;

  const optionDiv = clickElement.closest(".shipping-option");
  const radioInput = optionDiv.querySelector('input[name="shipping-option"]');
  const rateDataStr = optionDiv.getAttribute("data-rate");

  if (!optionDiv || !radioInput || !rateDataStr) return null;

  // Check the radio button
  radioInput.checked = true;

  const selectedRate = JSON.parse(rateDataStr);
  await sendToBack({ route: "/shipping/select", selectedRate });

  // Get the shipping cost and update summary
  const shippingCost = parseFloat(radioInput.value);
  await updateCartSummary(shippingCost);

  return true;
};

export const runCheckoutShippingOptionSelect = async (clickElement) => {
  if (!clickElement) return null;

  const optionDiv = clickElement.closest(".checkout-shipping-option");
  const radioInput = optionDiv.querySelector('input[name="checkout-shipping-option"]');
  const rateDataStr = optionDiv.getAttribute("data-rate");

  if (!optionDiv || !radioInput || !rateDataStr) return null;

  radioInput.checked = true;

  const selectedRate = JSON.parse(rateDataStr);
  await sendToBack({ route: "/shipping/select", selectedRate });

  // Update checkout summary with new shipping selection
  await updateCheckoutSummary();

  return true;
};
