import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const runAddNewProduct = async (inputParams) => {
  const { productsCollection } = CONFIG;

  const params = { ...inputParams };

  //store
  const storeModel = new dbModel(params, productsCollection);
  const storeData = await storeModel.storeAny();
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
  console.log("UPDATE DATA");
  console.log(updateData);

  return params;
};
