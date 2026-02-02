import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { updateCartSummary } from "./cart-run.js";

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

  // TODO: Call backend to calculate shipping
  // For now, mock response
  const data = await sendToBack(params);
  console.log("DATA");
  console.dir(data);

  const rateArray = data.rate;
  for (const rate of rateArray) {
    console.log("CARRIER NAME");
    console.log(rate.carrier_friendly_name);
    console.log("SERVICE TYPE");
    console.log(rate.service_type);
    console.log("COST");
    console.log(rate.shipping_amount.amount);
  }

  // if (!data || !data.success || !data.distance) {
  //   const errorMsg = "Failed to calculate shipping cost. Please check your ZIP code and try again.";
  //   await displayPopup(errorMsg, "error");
  //   return null;
  // }

  // const shippingCost = await calculateDistanceCost(data.distance);
  // if (!shippingCost) {
  //   const errorMsg = "Failed to calculate shipping cost. Please check your ZIP code and try again.";
  //   await displayPopup(errorMsg, "error");
  //   return null;
  // }

  // // Show result in calculator
  // const resultDiv = document.getElementById("shipping-calculator-result");
  // const resultValue = document.getElementById("shipping-result-value");
  // if (resultDiv && resultValue) {
  //   resultValue.textContent = `$${shippingCost.toFixed(2)}`;
  //   resultDiv.style.display = "flex";
  // }

  // // Update summary shipping
  // const shippingElement = document.getElementById("cart-summary-shipping");
  // if (shippingElement) {
  //   shippingElement.textContent = `$${shippingCost.toFixed(2)}`;
  // }

  // await updateCartSummary(shippingCost);
  // await displayPopup("Shipping calculated successfully", "success");

  // return true;
};

// export const calculateDistanceCost = async (distance) => {
//   if (!distance) return null;

//   if (distance > 1000) return 20;
//   if (distance > 300) return 10;
//   if (distance > 100) return 5;

//   return 0;
// };
