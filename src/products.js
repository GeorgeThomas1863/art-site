import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const runAddNewProduct = async (inputParams) => {
  const { productsCollection } = CONFIG;

  const { route: _, ...params } = inputParams;

  console.log("PARAMS");
  console.log(params);

  //store
  const storeModel = new dbModel(params, productsCollection);
  const storeData = await storeModel.storeAny();
  if (!storeData) return { success: false, message: "Failed to store product" };
  console.log("STORE DATA");
  console.log(storeData);

  //get id
  const newProductId = storeData.insertedId?.toString() || null;
  console.log("NEW PRODUCT ID");
  console.log(newProductId);

  params.productId = newProductId;

  const updateParams = {
    keyToLookup: "_id",
    itemValue: storeData.insertedId,
    updateObj: params,
  };

  const updateModel = new dbModel(updateParams, productsCollection);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return { success: false, message: "Failed to update product" };
  console.log("UPDATE DATA");
  console.log(updateData);

  params.success = true;
  params.message = "Product added successfully";

  return params;
};

export const runGetProductData = async () => {
  const { productsCollection } = CONFIG;

  const dataModel = new dbModel("", productsCollection);
  const data = await dataModel.getAll();
  return data;
};
