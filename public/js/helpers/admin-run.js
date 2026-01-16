import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams, buildNewEventParams, getEditEventParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "./popup.js";

//MODAL CONTROLS
export const runModalTrigger = async (clickElement) => {
  if (!clickElement) return null;

  const modalType = clickElement.getAttribute("data-modal-trigger");
  if (!modalType) return null;

  const modalId = `${modalType}-modal`;

  // If it's an edit modal, load the data first
  if (modalType.includes("edit-products")) {
    const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
    if (productData && productData.length) {
      await populateAdminProductSelector(productData);
      await updateProductStats(productData);
    }
  } else if (modalType.includes("edit-events")) {
    const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
    if (eventData && eventData.length) {
      await populateAdminEventSelector(eventData);
      await updateEventStats(eventData);
    }
  }

  openModal(modalId);
  return true;
};

// Run modal close
export const runModalClose = async (clickElement) => {
  if (!clickElement) return null;

  const modalId = clickElement.getAttribute("data-modal-close");
  if (!modalId) return null;

  closeModal(modalId);
  return true;
};

export const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("visible");
  }
};

export const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("visible");
  }
};

//+++++++++++++++++++++++++++++++

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
  closeModal("add-products-modal");

  // Refresh stats
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) await updateProductStats(productData);

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
    await updateProductStats(productData);

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
    await updateProductStats(productData);
  }

  // Clear the form fields
  await clearAdminEditFields();
  await disableAdminEditFields();
  productSelector.value = "";

  return data;
};

//++++++++++++++++++++++++++++

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

  await clearAdminAddFields("events");
  closeModal("add-events-modal");

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
    await updateEventStats(eventData);
  }

  await clearAdminEditFields();
  await disableAdminEditFields();
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
  await populateAdminEditForm(productObj);
};

export const changeAdminEventSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  const eventObj = selectedOption.eventData;
  if (!eventObj) return null;

  await enableAdminEditFields();
  await populateAdminEditForm(eventObj, "events");
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA
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

export const populateAdminEditForm = async (inputObj, entityType = "products") => {
  if (!inputObj) return null;
  if (entityType === "products") {
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

    return true;
  }

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
  currentImage.src = `/images/background/${picData.filename}`;
  currentImagePreview.style.display = "flex";

  return true;
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
  const clearFieldsArray = ["name", "price", "description", "event-date", "event-location", "event-description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  // Reset select dropdowns to defaults
  const productTypeSelect = document.getElementById("product-type");
  if (productTypeSelect) productTypeSelect.selectedIndex = 0; // Reset to first option (Acorns)

  const displaySelect = document.getElementById("display");
  if (displaySelect) displaySelect.value = "yes"; // Reset to default

  const soldSelect = document.getElementById("sold");
  if (soldSelect) soldSelect.value = "no"; // Reset to default

  // Clear image preview
  const currentImagePreview = document.getElementById("current-image-preview");
  if (currentImagePreview) currentImagePreview.style.display = "none";

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

  if (uploadInput) uploadInput.value = ""; // Clear the file input

  return true;
};

export const clearAdminEditFields = async () => {
  const clearFieldsArray = ["edit-name", "edit-price", "edit-description", "edit-event-date", "edit-event-location", "edit-event-description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  const currentImagePreview = document.getElementById("edit-current-image-preview");
  if (currentImagePreview) currentImagePreview.style.display = "none";

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

  if (uploadInput) uploadInput.value = "";

  // const deleteButton = document.getElementById("delete-product-button");
  // if (deleteButton) deleteButton.style.display = "none";

  const deleteProductButton = document.getElementById("delete-product-button");
  if (deleteProductButton) deleteProductButton.disabled = true;

  const deleteEventButton = document.getElementById("delete-event-button");
  if (deleteEventButton) deleteEventButton.disabled = true;

  return true;
};

//++++++++++++++++++++++++++

// STATS UPDATE [REWRITE BELOW WITH LOOPS]
export const updateProductStats = async (productData) => {
  if (!productData || !productData.length) return null;

  const totalProducts = productData.length;
  const displayedProducts = productData.filter((p) => p.display === "yes").length;
  const soldProducts = productData.filter((p) => p.sold === "yes").length;

  const totalStat = document.getElementById("total-products-stat");
  const displayedStat = document.getElementById("displayed-products-stat");
  const soldStat = document.getElementById("sold-products-stat");

  if (totalStat) totalStat.textContent = totalProducts;
  if (displayedStat) displayedStat.textContent = displayedProducts;
  if (soldStat) soldStat.textContent = soldProducts;

  return true;
};

export const updateEventStats = async (eventData) => {
  if (!eventData || !eventData.length) return null;

  const upcomingEvents = eventData.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const today = new Date();
    return eventDate >= today;
  }).length;

  const upcomingStat = document.getElementById("upcoming-events-stat");
  if (upcomingStat) upcomingStat.textContent = upcomingEvents;

  return true;
};

//========================================

// ENTITY SWITCHING
// export const runEntityTypeChange = async (changeElement) => {
//   if (!changeElement) return null;

//   const entityType = changeElement.value;
//   if (!entityType || (entityType !== "products" && entityType !== "events")) return null;

//   // Update tab button text
//   const addTabButton = document.getElementById("add-tab-button");
//   const editTabButton = document.getElementById("edit-tab-button");

//   if (entityType === "products") {
//     addTabButton.textContent = "Add Product";
//     editTabButton.textContent = "Edit Product";
//   } else {
//     addTabButton.textContent = "Add Event";
//     editTabButton.textContent = "Edit Event";
//   }

//   // Update data attributes
//   addTabButton.setAttribute("data-entity", entityType);
//   editTabButton.setAttribute("data-entity", entityType);

//   // Get current active tab
//   const activeButton = document.querySelector(".admin-tab-button.active");
//   const currentMode = activeButton ? activeButton.getAttribute("data-tab") : "add";

//   // Rebuild the forms for the new entity type
//   await rebuildFormsForEntity(entityType, currentMode);

//   return true;
// };

// export const rebuildFormsForEntity = async (entityType, activeMode = "add") => {
//   // Get the tab containers
//   const addTab = document.getElementById("add-tab");
//   const editTab = document.getElementById("edit-tab");

//   if (!addTab || !editTab) return null;

//   // Store current visibility
//   const addTabVisible = addTab.style.display !== "none";
//   const editTabVisible = editTab.style.display !== "none";

//   // Update data attributes
//   addTab.setAttribute("data-entity-type", entityType);
//   editTab.setAttribute("data-entity-type", entityType);

//   // Rebuild Add Tab
//   await rebuildTabContent(addTab, "add", entityType);

//   // Rebuild Edit Tab
//   await rebuildTabContent(editTab, "edit", entityType);

//   // Restore visibility
//   addTab.style.display = addTabVisible ? "block" : "none";
//   editTab.style.display = editTabVisible ? "block" : "none";

//   // If edit tab is visible, load the appropriate data
//   if (!editTabVisible) return true;
//   if (entityType === "products") {
//     const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
//     if (!productData || !productData.length) return true;
//     await populateAdminProductSelector(productData);
//     return true;
//   }

//   if (entityType === "events") {
//     const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
//     if (!eventData || !eventData.length) return true;
//     await populateAdminEventSelector(eventData);
//   }

//   return true;
// };

// export const rebuildTabContent = async (tabElement, mode, entityType) => {
//   if (!tabElement) return null;

//   // Clear existing content except title
//   const titleWrapper = tabElement.querySelector(".admin-tab-title-wrapper");
//   tabElement.innerHTML = "";
//   if (titleWrapper) {
//     tabElement.append(titleWrapper);
//   }

//   // Update title
//   const title = tabElement.querySelector(".admin-tab-title");
//   if (title) {
//     if (entityType === "products") {
//       title.textContent = mode === "add" ? "Add New Product" : "Edit Product";
//     } else {
//       title.textContent = mode === "add" ? "Add New Event" : "Edit Event";
//     }
//   }

//   // Add selector for edit mode
//   if (mode === "edit") {
//     if (entityType === "products") {
//       const productSelector = await buildAdminProductSelector();
//       tabElement.append(productSelector);
//     } else {
//       const eventSelector = await buildAdminEventSelector();
//       tabElement.append(eventSelector);
//     }
//   }

//   // Build appropriate fields based on entity type
//   if (entityType === "products") {
//     const adminName = await buildName(mode);
//     const productType = await buildProductType(mode);
//     const formInputList = await buildFormInputList(mode);
//     const dropDownRow = await buildDropDownRow(mode);
//     const adminUpload = await buildAdminUpload(mode);
//     const adminSubmit = await buildAdminSubmit(mode);

//     tabElement.append(adminName, productType, formInputList, dropDownRow, adminUpload, adminSubmit);
//     return true;
//   }

//   if (entityType === "events") {
//     const eventName = await buildName(mode);
//     const eventDate = await buildEventDate(mode);
//     const eventLocation = await buildEventLocation(mode);
//     const eventDescription = await buildEventDescription(mode);
//     const adminUpload = await buildAdminUpload(mode);
//     const adminSubmit = await buildAdminSubmit(mode);

//     tabElement.append(eventName, eventDate, eventLocation, eventDescription, adminUpload, adminSubmit);
//   }

//   return true;
// };

// //EVENT HANDLERS
// export const runTabClick = async (clickElement) => {
//   if (!clickElement) return null;
//   const tabType = clickElement.getAttribute("data-tab");
//   if (!tabType || (tabType !== "add" && tabType !== "edit")) return null;

//   const tabButtons = document.querySelectorAll(".admin-tab-button");
//   for (let i = 0; i < tabButtons.length; i++) {
//     tabButtons[i].classList.remove("active");
//   }
//   clickElement.classList.add("active");

//   const addTab = document.getElementById("add-tab");
//   const editTab = document.getElementById("edit-tab");

//   if (tabType === "add") {
//     addTab.style.display = "block";
//     editTab.style.display = "none";
//     return true;
//   }

//   addTab.style.display = "none";
//   editTab.style.display = "block";

//   const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");

//   console.log("PRODUCT DATA");
//   console.dir(productData);

//   await populateAdminProductSelector(productData); //in admin form

//   return true;
// };
