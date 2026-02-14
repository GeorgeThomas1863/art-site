import axios from "axios";
import dbModel from "../models/db-model.js";
import { validateZip, sanitizeMongoValue, validatePositiveInt } from "./sanitize.js";

export const runCalculateShipping = async (req) => {
  if (!req || !req.body || !req.body.zip || !req.body.productArray) return { success: false, message: "No ZIP code or product array provided" };
  const { zip, productArray } = req.body;

  if (!validateZip(zip)) return { success: false, message: "Invalid ZIP code format" };

  // console.log("PRODUCT ARRAY");
  // console.log(productArray);

  let totalWeight = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;

  for (const item of productArray) {
    const { productId, quantity } = item;
    const safeProductId = sanitizeMongoValue(productId);
    const safeQuantity = validatePositiveInt(quantity);
    if (!safeProductId || !safeQuantity) continue;

    const productModel = new dbModel({ keyToLookup: "productId", itemValue: safeProductId }, process.env.PRODUCTS_COLLECTION);
    const productData = await productModel.getUniqueItem();
    if (!productData || !productData.canShip) continue;
    console.log("PRODUCT DATA");
    console.log(productData);
    totalWeight += (productData.weight || 0) * safeQuantity;

    maxLength = Math.max(maxLength, productData.length || 0);
    maxWidth = Math.max(maxWidth, productData.width || 0);
    maxHeight = Math.max(maxHeight, productData.height || 0);
  }

  // Calculate girth and enforce 100" limit
  let girth = 2 * (maxWidth + maxHeight);

  if (girth > 100) {
    // Cap girth at 100 by scaling down the two smaller dimensions proportionally
    const scale = 100 / girth;
    maxWidth *= scale;
    maxHeight *= scale;
    girth = 100;
  }

  console.log("WEIGHT");
  console.log(totalWeight);
  console.log("LENGTH");
  console.log(maxLength);
  console.log("WIDTH");
  console.log(maxWidth);
  console.log("HEIGHT");
  console.log(maxHeight);
  console.log("GIRTH");
  console.log(girth);

  try {
    const usps = await getUSPS();
    console.log("USPS");
    console.log(usps);

    if (!usps) return { success: false, message: "Failed to get USPS carrier data" };

    const rateURL = `${process.env.SHIP_STATION_BASE_URL}/rates/estimate`;

    const rateParams = {
      carrier_ids: [usps],
      from_country_code: "US",
      from_postal_code: process.env.SHIPPING_ZIP, // Your fixed location
      to_country_code: "US",
      to_postal_code: zip,
      weight: {
        value: totalWeight,
        unit: "pound",
      },
      dimensions: {
        unit: "inch",
        length: maxLength,
        width: maxWidth,
        height: maxHeight,
      },
      address_residential_indicator: "yes",
    };

    // console.log("RATE PARAMS");
    // console.log(rateParams);

    const res = await axios.post(rateURL, rateParams, {
      headers: {
        "API-Key": process.env.SHIP_STATION_API_KEY,
        "Content-Type": "application/json",
      },
    });

    // console.log("RATE RESPONSE DATA");
    // console.log(res.data);

    // Apply business adjustments before any processing
    const adjustedRates = await applyShippingAdjustments(res.data);

    for (let i = 0; i < adjustedRates.length; i++) {
      adjustedRates[i].rateId = i;
    }

    let cheapestRate = null;
    for (let i = 0; i < adjustedRates.length; i++) {
      const rate = adjustedRates[i];
      if (!cheapestRate || rate.shipping_amount.amount < cheapestRate.shipping_amount.amount) {
        cheapestRate = rate;
      }
    }

    // Store ADJUSTED rates in session
    req.session.shipping = {
      zip: zip,
      selectedRate: cheapestRate,
      rateData: adjustedRates,
      calculatedAt: new Date().toISOString(),
    };

    return { success: true, message: "Shipping rate calculated successfully", rateData: adjustedRates };
  } catch (e) {
    console.log("RATE ERROR");
    console.log(e);
    console.log(e.response.data);
    return { success: false, message: "Failed to calculate shipping rate" };
  }
};

export const applyShippingAdjustments = async (rateArray) => {
  if (!rateArray || !Array.isArray(rateArray)) return rateArray;

  for (const rate of rateArray) {
    if (rate.delivery_days) {
      rate.delivery_days = rate.delivery_days + 2;
    }
    if (rate.estimated_delivery_date) {
      const deliveryDate = new Date(rate.estimated_delivery_date);
      deliveryDate.setUTCDate(deliveryDate.getUTCDate() + 2);
      rate.estimated_delivery_date = deliveryDate.toISOString().split("T")[0];
    }
    if (rate.shipping_amount && rate.shipping_amount.amount !== undefined) {
      rate.shipping_amount.amount = rate.shipping_amount.amount + 2;
    }
  }
  return rateArray;
};

export const getUSPS = async () => {
  const res = await axios.get(`${process.env.SHIP_STATION_BASE_URL}/carriers`, {
    headers: {
      "API-Key": process.env.SHIP_STATION_API_KEY,
    },
  });

  console.log("CARRIER RESPONSE DATA");
  console.log(res.data);

  for (const carrier of res.data.carriers) {
    if (carrier.friendly_name === "USPS") return carrier.carrier_id;
  }
  return null;
};

//-------------------

//SESSION FUNCTIONS
export const saveShippingToSession = async (req) => {
  const { shippingData } = req.body;

  if (!shippingData) {
    return { success: false, message: "No shipping data provided" };
  }

  req.session.shipping = shippingData;

  return { success: true, shipping: req.session.shipping };
};

export const getShippingFromSession = async (req) => {
  if (!req.session.shipping) {
    return { success: false, message: "No shipping data in session" };
  }

  return { success: true, shipping: req.session.shipping };
};

export const clearShippingFromSession = async (req) => {
  req.session.shipping = null;
  return { success: true };
};

export const updateSelectedRate = async (req) => {
  const { selectedRate } = req.body;

  if (!selectedRate) {
    return { success: false, message: "No selected rate provided" };
  }

  // Validate against session data — use server-side rate, not client-sent object
  if (!req.session.shipping || !req.session.shipping.rateData) {
    return { success: false, message: "No shipping rates in session. Calculate shipping first." };
  }

  const rateId = selectedRate.rateId;
  const sessionRate = req.session.shipping.rateData[rateId];
  if (rateId === undefined || rateId === null || !sessionRate) {
    return { success: false, message: "Invalid rate selection" };
  }

  // Use the rate from session, not the client-sent object
  req.session.shipping.selectedRate = sessionRate;

  return { success: true, shipping: req.session.shipping };
};
