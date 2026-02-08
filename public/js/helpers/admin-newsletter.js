import { sendToBack } from "../util/api-front.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { updateSubscriberStats } from "./admin-run.js";

// Send newsletter
export const runSendNewsletter = async () => {
  const subject = document.getElementById("newsletter-subject");
  const message = document.getElementById("newsletter-message");

  if (!subject || !subject.value.trim()) {
    await displayPopup("Please enter a subject line", "error");
    return null;
  }

  if (!message || !message.value.trim()) {
    await displayPopup("Please enter a message", "error");
    return null;
  }

  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  const subscriberCount = subscriberData ? subscriberData.length : 0;
  const confirmMessage = `Are you sure you want to send this newsletter to your ${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}?`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const newsletterParams = {
    route: "/newsletter/send",
    subject: subject.value.trim(),
    message: message.value.trim(),
  };

  console.log("SEND NEWSLETTER PARAMS");
  console.dir(newsletterParams);

  const data = await sendToBack(newsletterParams);
  if (!data || !data.success) {
    await displayPopup("Failed to send newsletter", "error");
    return null;
  }

  await displayPopup("Newsletter sent successfully", "success");

  // Remove modal
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  return data;
};

// Add subscriber
export const runAddSubscriber = async () => {
  const emailInput = document.getElementById("new-subscriber-email");

  if (!emailInput || !emailInput.value.trim()) {
    await displayPopup("Please enter an email address", "error");
    return null;
  }

  const email = emailInput.value.trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await displayPopup("Please enter a valid email address", "error");
    return null;
  }

  const subscriberParams = {
    route: "/newsletter/add",
    email: email,
  };

  console.log("ADD SUBSCRIBER PARAMS");
  console.dir(subscriberParams);

  const data = await sendToBack(subscriberParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add subscriber", "error");
    return null;
  }

  await displayPopup(`Added ${email} to mailing list`, "success");

  // Clear input
  emailInput.value = "";

  // Refresh subscriber list
  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  console.log("SUBSCRIBER DATA");
  console.dir(subscriberData);
  if (subscriberData) {
    await populateSubscriberList(subscriberData);
    await updateSubscriberStats(subscriberData);
  }

  return data;
};

// Remove subscriber
export const runRemoveSubscriber = async (clickElement) => {
  if (!clickElement) return null;

  const email = clickElement.getAttribute("data-email");
  if (!email) return null;

  const confirmMessage = `Are you sure you want to remove ${email} from the mailing list?`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const removeParams = {
    route: "/newsletter/remove",
    email: email,
  };

  console.log("REMOVE SUBSCRIBER PARAMS");
  console.dir(removeParams);

  const data = await sendToBack(removeParams);
  if (!data || !data.success) {
    await displayPopup("Failed to remove subscriber", "error");
    return null;
  }

  await displayPopup(`Removed ${email} from mailing list`, "success");

  // Refresh subscriber list
  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  if (subscriberData) {
    await populateSubscriberList(subscriberData);
    await updateSubscriberStats(subscriberData);
  }

  return data;
};

// Populate subscriber list
export const populateSubscriberList = async (subscriberArray) => {
  const subscriberList = document.getElementById("subscriber-list");
  if (!subscriberList) return null;

  // Clear existing content
  subscriberList.innerHTML = "";

  if (!subscriberArray || !subscriberArray.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "subscriber-empty-state";
    emptyState.textContent = "No subscribers yet";
    subscriberList.append(emptyState);
    return true;
  }

  for (let i = 0; i < subscriberArray.length; i++) {
    const subscriber = subscriberArray[i];
    const subscriberItem = document.createElement("div");
    subscriberItem.className = "subscriber-item";

    const emailText = document.createElement("span");
    emailText.className = "subscriber-email";
    emailText.textContent = subscriber.email || subscriber;

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn-delete-subscriber";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Remove subscriber";
    deleteButton.setAttribute("data-label", "remove-subscriber");
    deleteButton.setAttribute("data-email", subscriber.email || subscriber);

    subscriberItem.append(emailText, deleteButton);
    subscriberList.append(subscriberItem);
  }

  return true;
};
