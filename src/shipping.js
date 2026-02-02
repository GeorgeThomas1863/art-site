import axios from "axios";
import dbModel from "../models/db-model.js";

export const runCalculateShipping = async (inputParams) => {
  if (!inputParams || !inputParams.zip) return { success: false, message: "No ZIP code provided" };
  const { zip, weight, length, width, height } = inputParams;

  const rateURL = `${process.env.SHIP_STATION_BASE_URL}/rates/estimate`;

  const rateParams = {
    carrier_ids: [], // Empty = all carriers
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

  try {
    const res = await axios.post(rateURL, rateParams, {
      headers: {
        "API-Key": process.env.SHIP_STATION_API_KEY,
        "Content-Type": "application/json",
      },
    });
  
    console.log("RATE RESPONSE");
    console.log(res);

    return { success: true, message: "Shipping rate calculated successfully", rate: res.data };
  } catch (e) {
    console.log("RATE ERROR");
    console.log(e);
    console.log(e.response.data);
    return { success: false, message: "Failed to calculate shipping rate" };
  }


  // //zipSort = Z + zip
  // const params = {
  //   keyToLookup: "zipSort",
  //   itemValue: `Z${zip}`,
  // };

  // const shippingModel = new dbModel(params, process.env.SHIPPING_COLLECTION);
  // const shippingData = await shippingModel.getUniqueItem();
  // if (!shippingData || !shippingData.distance) return { success: false, message: "No shipping data found" };
  // shippingData.success = true;
  // shippingData.message = "Shipping data found";

  // return shippingData;
};
