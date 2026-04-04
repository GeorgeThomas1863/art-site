import { initQuill, resetQuill, populateAdminNewsletterSelector, initEditQuill, populateSubscriberList } from "./admin-newsletter.js";
import { populateAdminProductSelector } from "./admin-products.js";
import { populateAdminEventSelector } from "./admin-events.js";
// import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";
import { sendToBack } from "../util/api-front.js";
import { buildModal } from "../forms/admin-form.js";

//PROB REMOVE
const adminElement = document.getElementById("admin-element");

//MODAL CONTROLS
export const runModalTrigger = async (clickElement) => {
  if (!clickElement) return null;
  // console.log("RUN MODAL TRIGGER");
  // console.log("CLICK ELEMENT");
  // console.log(clickElement);

  const modalType = clickElement.getAttribute("data-label");
  if (!modalType) return null;

  const modalStr = modalType.split("-").slice(2).join("-");
  const [mode, entityType] = modalStr.split("-");

  // console.log("MODE");
  // console.log(mode);
  // console.log("ENTITY TYPE");
  // console.log(entityType);

  const modal = await buildModal(mode, entityType);
  adminElement.append(modal);

  // Load data for product edit
  if (mode === "edit" && entityType === "products") {
    const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
    // console.log("PRODUCT DATA");
    // console.dir(productData);
    if (productData && productData.length) {
      // console.log("PRODUCT DATA");
      // console.log(productData);
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

  if (mode === "edit" && entityType === "mailinglist") {
    const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
    if (subscriberData) {
      await populateSubscriberList(subscriberData);
      await updateSubscriberStats(subscriberData);
    }
  }

  if (mode === "edit" && entityType === "newsletter") {
    const newsletterData = await sendToBack({ route: "/newsletter/archive" }, "GET");
    if (newsletterData && newsletterData.length) {
      await populateAdminNewsletterSelector(newsletterData);
    }
  }

  modal.classList.add("visible");

  if (mode === "write" && entityType === "newsletter") {
    initQuill();
  }

  if (mode === "edit" && entityType === "newsletter") {
    initEditQuill();
  }

  return true;
};

// Run modal close
export const runModalClose = async (clickElement) => {
  if (!clickElement) return null;

  resetQuill();
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
    if ((soldIds.includes(changeId) || removeIds.includes(changeId)) && soldEl?.value === "yes" && removeEl?.value === "yes" && displayEl) {
      displayEl.value = "no";
      displayEl.classList.remove("status-yes", "status-no");
      displayEl.classList.add("status-no");
    }

    // display=yes + sold=yes → removeWhenSold=no
    if (displayIds.includes(changeId) && changeElement.value === "yes" && soldEl?.value === "yes" && removeEl) {
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
      input.value = !input.value || input.value === "N/A" || input.value === "0" ? "5" : input.value;
      input.disabled = false;
    }
  }
};

//+++++++++++++++++++++++

//FOR BOTH PRODUCTS AND EVENTS

export const enableAdminEditFields = async () => {
  const enableFieldsArray = [
    "edit-item-id",
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
    "edit-item-id",
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


export const clearAdminEditFields = async () => {
  const clearFieldsArray = [
    "edit-item-id",
    "edit-name",
    "edit-price",
    "edit-description",
    "edit-event-date",
    "edit-event-location",
    "edit-event-description",
  ];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

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

  // console.log("TOTAL PRODUCTS");
  // console.log(totalProducts);
  // console.log("DISPLAYED PRODUCTS");
  // console.log(displayedProducts);
  // console.log("SOLD PRODUCTS");
  // console.log(soldProducts);

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
