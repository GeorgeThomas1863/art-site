import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateEventStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewEventParams, getEditEventParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildPicSlot } from "../forms/admin-form.js";

//Add event
export const runAddNewEvent = async () => {
  const newEventParams = await buildNewEventParams();
  if (!newEventParams || !newEventParams.name || !newEventParams.eventDate) {
    await displayPopup("Please fill in all event fields before submitting", "error");
    return null;
  }

  const slotBtns = document.querySelectorAll(".pic-slots-container .upload-btn");
  let hasImage = false;
  for (let i = 0; i < slotBtns.length; i++) {
    if (slotBtns[i].uploadData) { hasImage = true; break; }
  }
  if (!hasImage) {
    await displayPopup("Please upload at least one image of the event", "error");
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

  // Reset event image slots
  const container = document.querySelector(".pic-slots-container");
  if (container) {
    while (container.firstChild) container.removeChild(container.firstChild);
    const emptySlot = buildPicSlot(0, "events");
    const slotUploadBtn = emptySlot.querySelector(".upload-btn");
    const slotFileInput = emptySlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
    container.append(emptySlot);
  }
  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = true;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  // console.log("SELECTED OPTION");
  // console.log(selectedOption);
  if (!selectedOption.value) {
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  const eventObj = selectedOption.eventData;
  // console.log("EVENT OBJ");
  // console.log(eventObj);
  if (!eventObj) return null;

  await enableAdminEditFields();
  await populateEditFormEvents(eventObj);
};

//+++++++++++++++++++++++++

export const populateAdminEventSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  // console.log("INPUT ARRAY");
  // console.log(inputArray);

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
    // console.log("EVENT");
    // console.log(event);
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

  const pics = picData ? (Array.isArray(picData) ? picData : [picData]) : [];
  const slotsContainer = document.querySelector(".pic-slots-container");
  if (slotsContainer) {
    // Clear existing slots safely
    while (slotsContainer.firstChild) slotsContainer.removeChild(slotsContainer.firstChild);
    for (let i = 0; i < pics.length; i++) {
      const slot = buildPicSlot(i, "events");
      const slotUploadBtn = slot.querySelector(".upload-btn");
      const slotCurrentImage = slot.querySelector(".current-image");
      const slotPlaceholder = slot.querySelector(".image-placeholder");
      const slotDeleteBtn = slot.querySelector(".delete-image-btn");
      const slotEditBtn = slot.querySelector(".edit-image-btn");
      if (slotUploadBtn) {
        slotUploadBtn.uploadData = pics[i];
        slotUploadBtn.textContent = "Change Image";
      }
      if (slotCurrentImage) {
        slotCurrentImage.src = `/images/events/${pics[i].filename}`;
        slotCurrentImage.classList.remove("hidden");
      }
      if (slotPlaceholder) slotPlaceholder.classList.add("hidden");
      if (slotDeleteBtn) slotDeleteBtn.classList.remove("hidden");
      if (slotEditBtn) slotEditBtn.classList.remove("hidden");

        const slotRevertBtn = slot.querySelector(".revert-image-btn");
        if (slotRevertBtn && pics[i].originalFilename && pics[i].filename !== pics[i].originalFilename) {
          slotRevertBtn.classList.remove("hidden");
        }

      slotsContainer.append(slot);
    }
    if (pics.length === 0) {
      slotsContainer.append(buildPicSlot(0, "events"));
    }
  }
  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = false;

  return true;
};

export const runRemovePicSlot = async (removeBtn) => {
  if (!removeBtn) return null;
  const slot = removeBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const entityType = uploadBtn?.entityType || "events";
  const filename = uploadBtn?.uploadData?.filename;
  const originalFilename = uploadBtn?.uploadData?.originalFilename;

  if (filename) {
    await sendToBack({ route: "/delete-pic-route", filename, entityType });
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  slot.remove();
};
