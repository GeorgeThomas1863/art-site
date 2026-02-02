import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { updateCartSummary } from "./cart-run.js";
import { buildShippingOption } from "../forms/cart-form.js";

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

  const cartData = await sendToBack({ route: "/cart/data" }, "GET");
  console.log("CART DATA");
  console.dir(cartData);

  const params = {
    route: "/checkout/calculate-shipping",
    zip: zip,
    weight: 5, //CALC FROM CART DATA
    width: 5, //CALC FROM CART DATA
    length: 10, //CALC FROM CART DATA
    height: 5, //CALC FROM CART DATA
  };

  const data = await sendToBack(params);
  if (!data) return null;
  console.log("DATA");
  console.dir(data);

  const rateArray = data.rateData;
  rateArray.sort((a, b) => a.shipping_amount.amount - b.shipping_amount.amount);

  const resultContainer = document.getElementById("shipping-calculator-result");
  if (!resultContainer) return null;

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

  await displayPopup("Shipping options loaded successfully", "success");
  return true;
};

export const runShippingOptionSelect = async (clickElement) => {
  if (!clickElement) return null;

  const optionDiv = clickElement.closest(".shipping-option");
  if (!optionDiv) return null;

  const radioInput = optionDiv.querySelector('input[name="shipping-option"]');
  if (!radioInput) return null;

  // Find the radio button within the clicked option div
  // const radioInput = clickElement.querySelector('input[name="shipping-option"]');
  // if (!radioInput) return null;

  // Check the radio button
  radioInput.checked = true;

  // Get the shipping cost and update summary
  const shippingCost = parseFloat(radioInput.value);
  await updateCartSummary(shippingCost);

  return true;
};
