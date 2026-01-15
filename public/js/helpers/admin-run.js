import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "./popup.js";
import {
  buildAdminProductSelector,
  buildAdminEventSelector,
  buildName,
  buildProductType,
  buildFormInputList,
  buildDropDownRow,
  buildEventDate,
  buildEventLocation,
  buildEventDescription,
  buildAdminSubmit,
  buildAdminUpload,
} from "../forms/admin-form.js";

// ENTITY SWITCHING
export const runEntityTypeChange = async (changeElement) => {
  if (!changeElement) return null;

  const entityType = changeElement.value;
  if (!entityType || (entityType !== "products" && entityType !== "events")) return null;

  // Update tab button text
  const addTabButton = document.getElementById("add-tab-button");
  const editTabButton = document.getElementById("edit-tab-button");

  if (entityType === "products") {
    addTabButton.textContent = "Add Product";
    editTabButton.textContent = "Edit Product";
  } else {
    addTabButton.textContent = "Add Event";
    editTabButton.textContent = "Edit Event";
  }

  // Update data attributes
  addTabButton.setAttribute("data-entity", entityType);
  editTabButton.setAttribute("data-entity", entityType);

  // Get current active tab
  const activeButton = document.querySelector(".admin-tab-button.active");
  const currentMode = activeButton ? activeButton.getAttribute("data-tab") : "add";

  // Rebuild the forms for the new entity type
  await rebuildFormsForEntity(entityType, currentMode);

  return true;
};

export const rebuildFormsForEntity = async (entityType, activeMode = "add") => {
  // Get the tab containers
  const addTab = document.getElementById("add-tab");
  const editTab = document.getElementById("edit-tab");

  if (!addTab || !editTab) return null;

  // Store current visibility
  const addTabVisible = addTab.style.display !== "none";
  const editTabVisible = editTab.style.display !== "none";

  // Update data attributes
  addTab.setAttribute("data-entity-type", entityType);
  editTab.setAttribute("data-entity-type", entityType);

  // Rebuild Add Tab
  await rebuildTabContent(addTab, "add", entityType);

  // Rebuild Edit Tab
  await rebuildTabContent(editTab, "edit", entityType);

  // Restore visibility
  addTab.style.display = addTabVisible ? "block" : "none";
  editTab.style.display = editTabVisible ? "block" : "none";

  // If edit tab is visible, load the appropriate data
  if (!editTabVisible) return true;
  if (entityType === "products") {
    const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
    if (!productData || !productData.length) return true;
    await populateAdminProductSelector(productData);
    return true;
  }

  if (entityType === "events") {
    const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
    if (!eventData || !eventData.length) return true;
    await populateAdminEventSelector(eventData);
  }

  return true;
};

export const rebuildTabContent = async (tabElement, mode, entityType) => {
  if (!tabElement) return null;

  // Clear existing content except title
  const titleWrapper = tabElement.querySelector(".admin-tab-title-wrapper");
  tabElement.innerHTML = "";
  if (titleWrapper) {
    tabElement.append(titleWrapper);
  }

  // Update title
  const title = tabElement.querySelector(".admin-tab-title");
  if (title) {
    if (entityType === "products") {
      title.textContent = mode === "add" ? "Add New Product" : "Edit Product";
    } else {
      title.textContent = mode === "add" ? "Add New Event" : "Edit Event";
    }
  }

  // Add selector for edit mode
  if (mode === "edit") {
    if (entityType === "products") {
      const productSelector = await buildAdminProductSelector();
      tabElement.append(productSelector);
    } else {
      const eventSelector = await buildAdminEventSelector();
      tabElement.append(eventSelector);
    }
  }

  // Build appropriate fields based on entity type
  if (entityType === "products") {
    const adminName = await buildName(mode);
    const productType = await buildProductType(mode);
    const formInputList = await buildFormInputList(mode);
    const dropDownRow = await buildDropDownRow(mode);
    const adminUpload = await buildAdminUpload(mode);
    const adminSubmit = await buildAdminSubmit(mode);

    tabElement.append(adminName, productType, formInputList, dropDownRow, adminUpload, adminSubmit);
    return true;
  }

  if (entityType === "events") {
    const eventName = await buildName(mode);
    const eventDate = await buildEventDate(mode);
    const eventLocation = await buildEventLocation(mode);
    const eventDescription = await buildEventDescription(mode);
    const adminUpload = await buildAdminUpload(mode);
    const adminSubmit = await buildAdminSubmit(mode);

    tabElement.append(eventName, eventDate, eventLocation, eventDescription, adminUpload, adminSubmit);
  }

  return true;
};

//EVENT HANDLERS
export const runTabClick = async (clickElement) => {
  if (!clickElement) return null;
  const tabType = clickElement.getAttribute("data-tab");
  if (!tabType || (tabType !== "add" && tabType !== "edit")) return null;

  const tabButtons = document.querySelectorAll(".admin-tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
  clickElement.classList.add("active");

  const addTab = document.getElementById("add-tab");
  const editTab = document.getElementById("edit-tab");

  if (tabType === "add") {
    addTab.style.display = "block";
    editTab.style.display = "none";
    return true;
  }

  addTab.style.display = "none";
  editTab.style.display = "block";

  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");

  console.log("PRODUCT DATA");
  console.dir(productData);

  await populateAdminProductSelector(productData); //in admin form

  return true;
};

//------

//Add product
export const runAddNewProduct = async () => {
  const newProductParams = await buildNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  console.log("NEW PRODUCT PARAMS");
  console.dir(newProductParams);

  //check if image uploaded
  const uploadButton = document.getElementById("upload-button");
  if (!uploadButton.uploadData) {
    await displayPopup("Please upload an image of the product first", "error");
    return null;
  }

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  console.log("DATA");
  console.dir(data);

  const popupText = `Product "${data.name}" added successfully`;
  await displayPopup(popupText, "success");

  // Clear the form after successful submission
  await clearAdminAddFields();

  return data;
};

//----

//Edit product
export const runEditProduct = async () => {
  // Need to get the selected product ID first
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to update", "error");
    return null;
  }
  const editProductParams = await getEditProductParams();
  if (!editProductParams || !editProductParams.name || !editProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  //FIX THE PIC HERE

  const productId = selectedOption.value;
  editProductParams.productId = productId;
  editProductParams.route = "/edit-product-route";
  console.log("UPDATE PRODUCT PARAMS");
  console.dir(editProductParams);

  const data = await sendToBack(editProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  // Refresh the product data to reflect changes
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    await populateAdminProductSelector(productData);

    // Re-select the product that was just updated so user can see the changes
    productSelector.value = productId;

    // Re-populate the form with the updated data
    const updatedOption = productSelector.options[productSelector.selectedIndex];
    if (updatedOption && updatedOption.productData) {
      await populateAdminEditForm(updatedOption.productData);
    }
  }

  return data;
};

export const runDeleteProduct = async () => {
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to delete", "error");
    return null;
  }

  const productName = document.getElementById("edit-name").value;
  const confirmMessage = `Are you sure you want to delete ${productName}? This action cannot be undone.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const productId = selectedOption.value;

  const data = await sendToBack({ route: "/delete-product-route", productId: productId });
  if (!data || !data.success) {
    await displayPopup("Failed to delete product", "error");
    return null;
  }

  const popupText = `Product "${productName}" deleted successfully`;
  await displayPopup(popupText, "success");

  // Refresh the product data to reflect changes
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    await populateAdminProductSelector(productData);
  }

  // Clear the form fields
  await clearAdminEditFields();

  // Disable all edit fields
  await disableAdminEditFields();

  // Reset product selector to default option
  productSelector.value = "";

  return data;
};

//---------------
//EVENT HANDLERS

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

  await clearAdminAddFields("events");

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
    eventSelector.value = eventId;
    const updatedOption = eventSelector.options[eventSelector.selectedIndex];
    if (updatedOption && updatedOption.eventData) {
      await populateAdminEditForm(updatedOption.eventData, "events");
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

  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  if (eventData) {
    await populateAdminEventSelector(eventData);
  }

  await clearAdminEditFields("events");
  await disableAdminEditFields("events");
  eventSelector.value = "";

  return data;
};

//++++++++++++++++++

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    // User selected the default "-- Select a product --" option
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  // Get product data directly from the property
  const productObj = selectedOption.productData;
  if (!productObj) return null;

  // Enable all fields
  await enableAdminEditFields();

  // Populate the form
  await populateAdminEditForm(productObj);
};

export const changeAdminEventSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    await clearAdminEditFields("events");
    await disableAdminEditFields("events");
    return null;
  }

  const eventObj = selectedOption.eventData;
  if (!eventObj) return null;

  await enableAdminEditFields("events");
  await populateAdminEditForm(eventObj, "events");
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA

//[sets data for rest of form]
export const populateAdminProductSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const productSelector = document.getElementById("product-selector");
  if (!productSelector) return;

  // Clear existing options except the default one
  const defaultOption = productSelector.querySelector("option[disabled]");
  productSelector.innerHTML = "";
  if (defaultOption) {
    productSelector.append(defaultOption);
  }

  // Add all products as options
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    option.textContent = `${product.name}`;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

export const populateAdminEventSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const eventSelector = document.getElementById("event-selector");
  if (!eventSelector) return;

  const defaultOption = eventSelector.querySelector("option[disabled]");
  eventSelector.innerHTML = "";
  if (defaultOption) {
    eventSelector.append(defaultOption);
  }

  for (let i = 0; i < inputArray.length; i++) {
    const event = inputArray[i];
    const option = document.createElement("option");
    option.value = event.eventId;
    option.textContent = `${event.name}`;
    option.eventData = event;
    eventSelector.append(option);
  }

  return true;
};

export const populateAdminEditForm = async (inputObj) => {
  if (!inputObj) return null;
  const { name, productType, price, description, display, sold, picData } = inputObj;

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    deleteButton.style.display = "block";
  }

  // Image preview - UPDATED IDs
  if (!picData || !picData.filename) return null;

  const currentImage = document.getElementById("edit-current-image");
  const currentImagePreview = document.getElementById("edit-current-image-preview");
  const editUploadButton = document.getElementById("edit-upload-button");
  if (!currentImage || !currentImagePreview || !editUploadButton) return null;

  //set pic data to upload button (to get correct pic when submitting edit)
  editUploadButton.uploadData = picData;
  currentImage.src = `/images/products/${picData.filename}`;
  currentImagePreview.style.display = "flex";
};

//-----------------

export const enableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = false;
    }
  }

  return true;
};

export const disableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = true;
    }
  }

  return true;
};

export const clearAdminAddFields = async () => {
  const clearFieldsArray = ["name", "price", "description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  // Reset select dropdowns to defaults
  const productTypeSelect = document.getElementById("product-type");
  if (productTypeSelect) {
    productTypeSelect.selectedIndex = 0; // Reset to first option (Acorns)
  }

  const displaySelect = document.getElementById("display");
  if (displaySelect) {
    displaySelect.value = "yes"; // Reset to default
  }

  const soldSelect = document.getElementById("sold");
  if (soldSelect) {
    soldSelect.value = "no"; // Reset to default
  }

  // Clear image preview
  const currentImagePreview = document.getElementById("current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  // Reset upload button and status
  const uploadButton = document.getElementById("upload-button");
  const uploadStatus = document.getElementById("upload-status");
  const uploadInput = document.getElementById("upload-pic-input");

  if (uploadButton) {
    uploadButton.uploadData = null;
    uploadButton.textContent = "Choose Image";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.style.display = "none";
  }

  if (uploadInput) {
    uploadInput.value = ""; // Clear the file input
  }

  return true;
};

export const clearAdminEditFields = async () => {
  const clearFieldsArray = ["edit-name", "edit-price", "edit-description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  const currentImagePreview = document.getElementById("edit-current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  // Clear upload data
  const uploadButton = document.getElementById("edit-upload-button");
  const uploadStatus = document.getElementById("edit-upload-status");
  const uploadInput = document.getElementById("edit-upload-pic-input");

  if (uploadButton) {
    uploadButton.uploadData = null;
    uploadButton.textContent = "Change Image";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.style.display = "none";
  }

  if (uploadInput) {
    uploadInput.value = "";
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    deleteButton.style.display = "none";
  }

  return true;
};
