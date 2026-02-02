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

    // Store all rates in session for later use
    req.session.shipping = {
      zip: zip,
      selectedRate: null,
      rateData: res.data,
      calculatedAt: new Date().toISOString(),
    };

    return { success: true, message: "Shipping rate calculated successfully", rateData: res.data };
  } catch (e) {
    console.log("RATE ERROR");
    console.log(e);
    console.log(e.response.data);
    return { success: false, message: "Failed to calculate shipping rate" };
  }
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
