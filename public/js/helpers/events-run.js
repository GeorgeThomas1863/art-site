import { buildEventCard } from "../forms/events-form.js";
import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";

// Populate the events grid with event cards
export const populateEvents = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const eventsGrid = document.getElementById("events-grid");

  if (!eventsGrid) {
    console.error("Events grid not found");
    return;
  }

  // Clear existing events
  eventsGrid.innerHTML = "";

  // Build and append each event card
  for (let i = 0; i < inputArray.length; i++) {
    const event = inputArray[i];
    const eventCard = await buildEventCard(event);
    eventsGrid.append(eventCard);
  }

  return true;
};

//-----------------

export const runEventsNewsletterToggle = async (clickElement) => {
  const emailWrapper = document.getElementById("events-newsletter-email-wrapper");
  if (!emailWrapper) return null;

  if (clickElement.checked) {
    emailWrapper.classList.remove("hidden");
    return true;
  }

  emailWrapper.classList.add("hidden");
  return true;
};

export const runEventsNewsletterSubmit = async () => {
  const emailInput = document.getElementById("events-newsletter-email");
  if (!emailInput) return null;

  const email = emailInput.value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    await displayPopup("Please enter a valid email address", "error");
    return null;
  }

  const params = {
    route: "/newsletter/add",
    email: email,
  };

  const data = await sendToBack(params);
  console.log("DATA");
  console.dir(data);

  if (!data || !data.success) {
    await displayPopup("Failed to subscribe. Please try again.", "error");
    return null;
  }

  if (data.message === "Email already subscribed") {
    await displayPopup(`${data.email} is already subscribed to our newsletter!`, "error");
    return null;
  }

  await displayPopup("Successfully subscribed to our newsletter!", "success");

  // Reset the form
  emailInput.value = "";
  const checkbox = document.getElementById("events-newsletter");
  if (checkbox) checkbox.checked = false;

  const emailWrapper = document.getElementById("events-newsletter-email-wrapper");
  if (emailWrapper) emailWrapper.classList.add("hidden");

  return true;
};
