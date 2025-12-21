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

export const runEditProduct = async (inputParams) => {
  const { productsCollection } = CONFIG;

  const { route: _, ...params } = inputParams;

  const checkParams = {
    keyToLookup: "productId",
    itemValue: params.productId,
  };

  const checkModel = new dbModel(checkParams, productsCollection);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Product not found" };
  console.log("CHECK DATA");
  console.log(checkData);

  //otherwise update
  const editParams = {
    keyToLookup: "productId",
    itemValue: params.productId,
    updateObj: params,
  };

  const editModel = new dbModel(editParams, productsCollection);
  const editData = await editModel.updateObjItem();
  if (!editData) return { success: false, message: "Failed to update product" };
  console.log("EDIT DATA");
  console.log(editData);

  params.success = true;
  params.message = "Product updated successfully";

  return params;
};

export const runDeleteProduct = async (productId) => {
  const { productsCollection } = CONFIG;

  const checkParams = {
    keyToLookup: "productId",
    itemValue: productId,
  };

  const checkModel = new dbModel(checkParams, productsCollection);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Product not found" };
  console.log("CHECK DATA");
  console.log(checkData);

  const params = {
    keyToLookup: "productId",
    itemValue: productId,
  };

  const deleteModel = new dbModel(params, productsCollection);
  const deleteData = await deleteModel.deleteItem();
  if (!deleteData) return { success: false, message: "Failed to delete product" };

  params.success = true;
  params.message = "Product deleted successfully";
  params.productId = productId; //for tracking

  return params;
};

export const runGetProductData = async () => {
  const { productsCollection } = CONFIG;

  const dataModel = new dbModel("", productsCollection);
  const data = await dataModel.getAll();
  return data;
};
