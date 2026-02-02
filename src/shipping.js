import axios from "axios";
// import dbModel from "../models/db-model.js";

export const runCalculateShipping = async (inputParams) => {
  if (!inputParams || !inputParams.zip) return { success: false, message: "No ZIP code provided" };
  const { zip, weight, length, width, height } = inputParams;

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

//return array of all carrier ids
// export const getCarrierArray = async () => {
//   const res = await axios.get(`${process.env.SHIP_STATION_BASE_URL}/carriers`, {
//     headers: {
//       "API-Key": process.env.SHIP_STATION_API_KEY,
//     },
//   });

//   console.log("CARRIER RESPONSE DATA");
//   console.log(res.data);

//   const returnArray = [];
//   for (const carrier of res.data.carriers) {
//     if (carrier.carrier_id) {
//       console.log("CARRIER ID");
//       console.log(carrier.carrier_id);
//       returnArray.push(carrier.carrier_id);
//     }
//   }
//   console.log("RETURN ARRAY");
//   console.log(returnArray);
//   return returnArray;
// };
