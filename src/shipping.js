import dbModel from "../models/db-model.js";

export const runCalculateShipping = async (zip) => {
  if (!zip) return { success: false, message: "No ZIP code provided" };

  //zipSort = Z + zip
  const params = {
    keyToLookup: "zipSort",
    itemValue: `Z${zip}`,
  };

  const shippingModel = new dbModel(params, process.env.SHIPPING_COLLECTION);
  const shippingData = await shippingModel.getUniqueItem();
  if (!shippingData || !shippingData.distance) return { success: false, message: "No shipping data found" };
  shippingData.success = true;
  shippingData.message = "Shipping data found";

  return shippingData;
};
