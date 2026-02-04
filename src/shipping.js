import axios from "axios";

export const runCalculateShipping = async (req) => {
  if (!req || !req.body || !req.body.zip) return { success: false, message: "No ZIP code provided" };
  const { zip, weight, length, width, height } = req.body;

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
        value: weight,
        unit: "pound",
      },
      dimensions: {
        unit: "inch",
        length: length,
        width: width,
        height: height,
      },
      address_residential_indicator: "yes",
    };

    console.log("RATE PARAMS");
    console.log(rateParams);

    const res = await axios.post(rateURL, rateParams, {
      headers: {
        "API-Key": process.env.SHIP_STATION_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("RATE RESPONSE DATA");
    console.log(res.data);

    // Apply business adjustments before any processing
    const adjustedRates = await applyShippingAdjustments(res.data);

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
      deliveryDate.setDate(deliveryDate.getDate() + 2);
      rate.estimated_delivery_date = deliveryDate.toISOString();
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

  if (!req.session.shipping) {
    req.session.shipping = {};
  }

  req.session.shipping.selectedRate = selectedRate;

  return { success: true, shipping: req.session.shipping };
};
