import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateEventStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewEventParams, getEditEventParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";

//Add event
export const runAddNewEvent = async () => {
  const newEventParams = await buildNewEventParams();
  if (!newEventParams || !newEventParams.name || !newEventParams.eventDate) {
    await displayPopup("Please fill in all event fields before submitting", "error");
    return null;
  }

  const uploadButton = document.getElementById("upload-button");
  if (!uploadButton.uploadData) {
    await displayPopup("Please upload an image for the event first", "error");
    return null;
  }

  const data = await sendToBack(newEventParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new event", "error");
    return null;
  }

  const popupText = `Event "${data.name}" added successfully`;
  await displayPopup(popupText, "success");

  // Remove modal
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  // await clearAdminAddFields("events");
  // closeModal("add-events-modal");

  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  if (eventData) await updateEventStats(eventData);

  return data;
};

export const runEditEvent = async () => {
  const eventSelector = document.getElementById("event-selector");
  const selectedOption = eventSelector.options[eventSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select an event to update", "error");
    return null;
  }

  const editEventParams = await getEditEventParams();
  if (!editEventParams || !editEventParams.name || !editEventParams.eventDate) {
    await displayPopup("Please fill in all event fields before submitting", "error");
    return null;
  }

  const eventId = selectedOption.value;
  editEventParams.eventId = eventId;
  editEventParams.route = "/edit-event-route";

  const data = await sendToBack(editEventParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update event", "error");
    return null;
  }

  const popupText = `Event "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  if (eventData) {
    await populateAdminEventSelector(eventData);
    await updateEventStats(eventData);

    eventSelector.value = eventId;
    // Re-populate the form with the updated data
    const updatedOption = eventSelector.options[eventSelector.selectedIndex];
    if (updatedOption && updatedOption.eventData) {
      await populateEditFormEvents(updatedOption.eventData);
    }
  }

  return data;
};

export const runDeleteEvent = async () => {
  const eventSelector = document.getElementById("event-selector");
  const selectedOption = eventSelector.options[eventSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select an event to delete", "error");
    return null;
  }

  const eventName = document.getElementById("edit-name").value;
  const confirmMessage = `Are you sure you want to delete ${eventName}? This action cannot be undone.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const eventId = selectedOption.value;

  const data = await sendToBack({ route: "/delete-event-route", eventId: eventId });
  if (!data || !data.success) {
    await displayPopup("Failed to delete event", "error");
    return null;
  }

  const popupText = `Event "${eventName}" deleted successfully`;
  await displayPopup(popupText, "success");

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  if (eventData) {
    // await populateAdminEventSelector(eventData);
    await updateEventStats(eventData);
  }

  // await clearAdminEditFields();
  // await disableAdminEditFields();
  // eventSelector.value = "";

  return data;
};

//+++++++++++++++++++++++++

export const changeAdminEventSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  console.log("SELECTED OPTION");
  console.log(selectedOption);
  if (!selectedOption.value) {
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  const eventObj = selectedOption.eventData;
  console.log("EVENT OBJ");
  console.log(eventObj);
  if (!eventObj) return null;

  await enableAdminEditFields();
  await populateEditFormEvents(eventObj);
};

//+++++++++++++++++++++++++

export const populateAdminEventSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  console.log("INPUT ARRAY");
  console.log(inputArray);

  const eventSelector = document.getElementById("event-selector");
  if (!eventSelector) return;

  const defaultOption = eventSelector.querySelector("option[disabled]");
  eventSelector.innerHTML = "";
  if (defaultOption) {
    eventSelector.append(defaultOption);
  }

  // Sort by most recently added first
  inputArray.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  for (let i = 0; i < inputArray.length; i++) {
    const event = inputArray[i];
    console.log("EVENT");
    console.log(event);
    const option = document.createElement("option");
    option.value = event.eventId;
    option.textContent = `${event.name}`;
    option.eventData = event;
    eventSelector.append(option);
  }

  return true;
};

export const populateEditFormEvents = async (inputObj) => {
  if (!inputObj) return null;
  //otherwise events
  const { name, eventDate, eventLocation, eventDescription, picData } = inputObj;

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-event-date", value: eventDate },
    { id: "edit-event-location", value: eventLocation },
    { id: "edit-event-description", value: eventDescription },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  const deleteButton = document.getElementById("delete-event-button");
  if (deleteButton) {
    deleteButton.disabled = false;
  }

  if (!picData || !picData.filename) return null;

  const currentImage = document.getElementById("edit-current-image");
  const currentImagePreview = document.getElementById("edit-current-image-preview");
  const editUploadButton = document.getElementById("edit-upload-button");
  if (!currentImage || !currentImagePreview || !editUploadButton) return null;

  //set pic data to upload button (to get correct pic when submitting edit)
  editUploadButton.uploadData = picData;
  currentImage.src = `/images/events/${picData.filename}`;
  currentImage.style.display = "block";
  currentImagePreview.style.display = "flex";

  const deleteImageBtn = document.getElementById("edit-delete-image-btn");
  if (deleteImageBtn) deleteImageBtn.style.display = "block";

  const placeholder = currentImagePreview.querySelector(".image-placeholder");
  if (placeholder) placeholder.style.display = "none";

  return true;
};
