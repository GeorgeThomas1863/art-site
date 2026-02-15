import dbModel from "../models/db-model.js";

export const storeEvent = async (inputParams) => {
  const { route: _, ...params } = inputParams;

  console.log("PARAMS");
  console.log(params);

  //store
  const storeModel = new dbModel(params, process.env.EVENTS_COLLECTION);
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

  const updateModel = new dbModel(updateParams, process.env.EVENTS_COLLECTION);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return { success: false, message: "Failed to update product" };
  console.log("UPDATE DATA");
  console.log(updateData);

  params.success = true;
  params.message = "Product added successfully";

  return params;
};

export const updateEvent = async (inputParams) => {
  const { route: _, ...params } = inputParams;

  const checkParams = {
    keyToLookup: "eventId",
    itemValue: params.eventId,
  };

  const checkModel = new dbModel(checkParams, process.env.EVENTS_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Event not found" };
  console.log("CHECK DATA");
  console.log(checkData);

  //otherwise update
  const editParams = {
    keyToLookup: "eventId",
    itemValue: params.eventId,
    updateObj: params,
  };

  const editModel = new dbModel(editParams, process.env.EVENTS_COLLECTION);
  const editData = await editModel.updateObjItem();
  if (!editData) return { success: false, message: "Failed to update event" };
  console.log("EDIT DATA");
  console.log(editData);

  params.success = true;
  params.message = "Event updated successfully";

  return params;
};

export const deleteEvent = async (eventId) => {
  const checkParams = {
    keyToLookup: "eventId",
    itemValue: eventId,
  };

  const checkModel = new dbModel(checkParams, process.env.EVENTS_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Event not found" };
  // console.log("CHECK DATA");
  // console.log(checkData);

  const params = {
    keyToLookup: "eventId",
    itemValue: eventId,
  };

  const deleteModel = new dbModel(params, process.env.EVENTS_COLLECTION);
  const deleteData = await deleteModel.deleteItem();
  if (!deleteData) return { success: false, message: "Failed to delete event" };

  params.success = true;
  params.message = "Event deleted successfully";
  params.eventId = eventId; //for tracking

  return params;
};

export const runGetEventData = async () => {
  const dataModel = new dbModel("", process.env.EVENTS_COLLECTION);
  const data = await dataModel.getAll();
  // console.log("EVENT DATA");
  // console.log(data);
  return data;
};
