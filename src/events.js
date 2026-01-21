import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const runAddNewEvent = async (inputParams) => {
  const { eventsCollection } = CONFIG;

  const { route: _, ...params } = inputParams;

  console.log("PARAMS");
  console.log(params);

  //store
  const storeModel = new dbModel(params, eventsCollection);
  const storeData = await storeModel.storeAny();
  if (!storeData) return { success: false, message: "Failed to store product" };
  console.log("STORE DATA");
  console.log(storeData);

  //get id
  const newEventId = storeData.insertedId?.toString() || null;
  console.log("NEW event ID");
  console.log(newEventId);

  params.eventId = newEventId;

  const updateParams = {
    keyToLookup: "_id",
    itemValue: storeData.insertedId,
    updateObj: params,
  };

  const updateModel = new dbModel(updateParams, eventsCollection);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return { success: false, message: "Failed to update product" };
  console.log("UPDATE DATA");
  console.log(updateData);

  params.success = true;
  params.message = "Product added successfully";

  return params;
};
