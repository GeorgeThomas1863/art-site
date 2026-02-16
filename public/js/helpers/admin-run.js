import { populateAdminProductSelector } from "./admin-products.js";
import { populateAdminEventSelector } from "./admin-events.js";
import { populateSubscriberList } from "./admin-newsletter.js";
// import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";
import { sendToBack } from "../util/api-front.js";
import { buildModal } from "../forms/admin-form.js";

//PROB REMOVE
const adminElement = document.getElementById("admin-element");

//MODAL CONTROLS
export const runModalTrigger = async (clickElement) => {
  if (!clickElement) return null;
  console.log("RUN MODAL TRIGGER");
  console.log("CLICK ELEMENT");
  console.log(clickElement);

  const modalType = clickElement.getAttribute("data-label");
  if (!modalType) return null;

  const modalStr = modalType.split("-").slice(2).join("-");
  const [mode, entityType] = modalStr.split("-");

  console.log("MODE");
  console.log(mode);
  console.log("ENTITY TYPE");
  console.log(entityType);

  const modal = await buildModal(mode, entityType);
  adminElement.append(modal);

  // Load data for product edit
  if (mode === "edit" && entityType === "products") {
    const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
    if (productData && productData.length) {
      console.log("PRODUCT DATA");
      console.log(productData);
      await populateAdminProductSelector(productData);
      await updateProductStats(productData);
    }
  }

  // Load data for event edit
  if (mode === "edit" && entityType === "events") {
    const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
    if (eventData && eventData.length) {
      await populateAdminEventSelector(eventData);
      await updateEventStats(eventData);
    }
  }

  if (mode === "edit" && entityType === "newsletter") {
    const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
    if (subscriberData && subscriberData.length) {
      await populateSubscriberList(subscriberData);
      await updateSubscriberStats(subscriberData);
    }
  }

  modal.classList.add("visible");

  return true;
};

// Run modal close
export const runModalClose = async (clickElement) => {
  if (!clickElement) return null;

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();
  return true;
};

export const runChangeStatusCard = async (changeElement) => {
  if (!changeElement) return null;

  const changeId = changeElement.id;

  changeElement.classList.remove("status-yes", "status-no");
  changeElement.classList.add(`status-${changeElement.value}`);

  // Cross-flag logic for sold / removeWhenSold / display
  const soldIds = ["sold", "edit-sold"];
  const removeIds = ["remove-when-sold", "edit-remove-when-sold"];
  const displayIds = ["display", "edit-display"];

  if (soldIds.includes(changeId) || removeIds.includes(changeId) || displayIds.includes(changeId)) {
    const prefix = changeId.startsWith("edit-") ? "edit-" : "";
    const soldEl = document.getElementById(`${prefix}sold`);
    const removeEl = document.getElementById(`${prefix}remove-when-sold`);
    const displayEl = document.getElementById(`${prefix}display`);

    // sold=yes + removeWhenSold=yes → display=no
    if ((soldIds.includes(changeId) || removeIds.includes(changeId))
        && soldEl?.value === "yes" && removeEl?.value === "yes" && displayEl) {
      displayEl.value = "no";
      displayEl.classList.remove("status-yes", "status-no");
      displayEl.classList.add("status-no");
    }

    // display=yes + sold=yes → removeWhenSold=no
    if (displayIds.includes(changeId) && changeElement.value === "yes"
        && soldEl?.value === "yes" && removeEl) {
      removeEl.value = "no";
      removeEl.classList.remove("status-yes", "status-no");
      removeEl.classList.add("status-no");
    }
  }

  // Update shipping fields for can-ship toggle
  if (changeId !== "can-ship" && changeId !== "edit-can-ship") return null;

  const prefix = changeId.includes("edit") ? "edit-" : "";
  const shippingIds = [`${prefix}length`, `${prefix}width`, `${prefix}height`, `${prefix}weight`];

  for (const id of shippingIds) {
    const input = document.getElementById(id);
    if (!input) continue;
    if (changeElement.value === "no") {
      input.value = "N/A";
      input.disabled = true;
    } else {
      input.value = "";
      input.disabled = false;
    }
  }
};

//+++++++++++++++++++++++

//FOR BOTH PRODUCTS AND EVENTS

export const enableAdminEditFields = async () => {
  const enableFieldsArray = [
    "edit-name",
    "edit-product-type",
    "edit-price",
    "edit-description",
    "edit-display",
    "edit-sold",
    "edit-can-ship",
    "edit-remove-when-sold",
    "edit-length",
    "edit-width",
    "edit-height",
    "edit-weight",
    "edit-upload-pic-input",
    "edit-upload-button",
    "edit-submit-button",
    "edit-event-date",
    "edit-event-location",
    "edit-event-description",
    "edit-event-submit-button",
  ];
  for (let i = 0; i < enableFieldsArray.length; i++) {
    const field = document.getElementById(enableFieldsArray[i]);
    if (field) {
      field.disabled = false;
    }
  }

  return true;
};

export const disableAdminEditFields = async () => {
  const disableFieldsArray = [
    "edit-name",
    "edit-product-type",
    "edit-price",
    "edit-description",
    "edit-display",
    "edit-sold",
    "edit-can-ship",
    "edit-remove-when-sold",
    "edit-length",
    "edit-width",
    "edit-height",
    "edit-weight",
    "edit-upload-pic-input",
    "edit-upload-button",
    "edit-submit-button",
    "edit-event-date",
    "edit-event-location",
    "edit-event-description",
    "edit-event-submit-button",
  ];
  for (let i = 0; i < disableFieldsArray.length; i++) {
    const field = document.getElementById(disableFieldsArray[i]);
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

  const removeWhenSoldSelect = document.getElementById("remove-when-sold");
  if (removeWhenSoldSelect) removeWhenSoldSelect.value = "yes"; // Reset to default

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

// STATS UPDATE
export const updateAdminStats = async () => {
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  const eventData = await sendToBack({ route: "/get-event-data-route" }, "GET");
  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");

  if (productData && productData.length) await updateProductStats(productData);
  if (eventData && eventData.length) await updateEventStats(eventData);
  if (subscriberData && subscriberData.length) await updateSubscriberStats(subscriberData);

  return true;
};

export const updateProductStats = async (productData) => {
  if (!productData || !productData.length) return null;

  const totalProducts = productData.length;
  const displayedProducts = productData.filter((p) => p.display === "yes").length;
  const soldProducts = productData.filter((p) => p.sold === "yes").length;

  console.log("TOTAL PRODUCTS");
  console.log(totalProducts);
  console.log("DISPLAYED PRODUCTS");
  console.log(displayedProducts);
  console.log("SOLD PRODUCTS");
  console.log(soldProducts);

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

export const updateSubscriberStats = async (subscriberData) => {
  if (!subscriberData) return null;

  const totalSubscribers = Array.isArray(subscriberData) ? subscriberData.length : 0;

  const subscriberStat = document.getElementById("total-subscribers-stat");
  if (subscriberStat) subscriberStat.textContent = totalSubscribers;

  return true;
};
