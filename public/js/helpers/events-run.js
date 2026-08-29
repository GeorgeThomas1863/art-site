import { buildEventCard } from "../forms/events-form.js";
import { splitEventsByDate } from "./events-date.js";
import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";

// Populate the events grid with event cards
export const populateEvents = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const eventsGrid = document.getElementById("events-grid");
  const oldEventsGrid = document.getElementById("old-events-grid");
  if (!eventsGrid || !oldEventsGrid) {
    console.error("Events grids not found");
    return;
  }

  const todayString = buildLocalDateString(new Date());
  const { upcomingEvents, oldEvents } = splitEventsByDate(inputArray, todayString);

  await populateEventsGrid(eventsGrid, upcomingEvents);
  await populateEventsGrid(oldEventsGrid, oldEvents);
  return true;
};

const populateEventsGrid = async (eventsGrid, events) => {
  eventsGrid.innerHTML = "";

  for (const event of events) {
    const eventCard = await buildEventCard(event);
    if (!eventCard) continue;
    eventsGrid.append(eventCard);
  }
};

const buildLocalDateString = (date) => {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  // console.log("DATA");
  // console.dir(data);

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
