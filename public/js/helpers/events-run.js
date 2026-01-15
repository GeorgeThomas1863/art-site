import { buildEventCard } from "../forms/events-form.js";

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
