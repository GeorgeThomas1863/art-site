import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const runAddNewEvent = async (inputParams) => {
  const { eventsCollection } = CONFIG;

  const { route: _, ...params } = inputParams;

  console.log("EVENT PARAMS");
  console.log(params);

  //store
  const storeModel = new dbModel(params, eventsCollection);
  const storeData = await storeModel.storeAny();
  if (!storeData) return { success: false, message: "Failed to store event" };
  console.log("STORE DATA");
  console.log(storeData);

  //get id
  const newEventId = storeData.insertedId?.toString() || null;
  console.log("NEW EVENT ID");
  console.log(newEventId);

  params.eventId = newEventId;

  const updateParams = {
    keyToLookup: "_id",
    itemValue: storeData.insertedId,
    updateObj: params,
  };

  const updateModel = new dbModel(updateParams, eventsCollection);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return { success: false, message: "Failed to update event" };
  console.log("UPDATE DATA");
  console.log(updateData);

  params.success = true;
  params.message = "Event added successfully";

  return params;
};

export const runEditEvent = async (inputParams) => {
  const { eventsCollection } = CONFIG;

  const { route: _, ...params } = inputParams;

  const checkParams = {
    keyToLookup: "eventId",
    itemValue: params.eventId,
  };

  const checkModel = new dbModel(checkParams, eventsCollection);
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

  const editModel = new dbModel(editParams, eventsCollection);
  const editData = await editModel.updateObjItem();
  if (!editData) return { success: false, message: "Failed to update event" };
  console.log("EDIT DATA");
  console.log(editData);

  params.success = true;
  params.message = "Event updated successfully";

  return params;
};

export const runDeleteEvent = async (eventId) => {
  const { eventsCollection } = CONFIG;

  const checkParams = {
    keyToLookup: "eventId",
    itemValue: eventId,
  };

  const checkModel = new dbModel(checkParams, eventsCollection);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Event not found" };
  console.log("CHECK DATA");
  console.log(checkData);

  const params = {
    keyToLookup: "eventId",
    itemValue: eventId,
  };

  const deleteModel = new dbModel(params, eventsCollection);
  const deleteData = await deleteModel.deleteItem();
  if (!deleteData) return { success: false, message: "Failed to delete event" };

  params.success = true;
  params.message = "Event deleted successfully";
  params.eventId = eventId; //for tracking

  return params;
};

//---------------

export const runGetEventData = async () => {
  const { eventsCollection } = CONFIG;

  const dataModel = new dbModel("", eventsCollection);
  const data = await dataModel.getAll();
  return data;
};
