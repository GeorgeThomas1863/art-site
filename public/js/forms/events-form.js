// Build the events page
export const buildEventsForm = async () => {
  const eventsContainer = document.createElement("div");
  eventsContainer.id = "events-container";
  eventsContainer.className = "events-container";

  const eventsHeader = await buildEventsHeader();
  const eventsGrid = await buildEventsGrid();

  eventsContainer.append(eventsHeader, eventsGrid);

  return eventsContainer;
};

// Build the page header
export const buildEventsHeader = async () => {
  const eventsHeader = document.createElement("div");
  eventsHeader.className = "events-page-header";

  const title = document.createElement("h1");
  title.className = "events-page-title";
  title.textContent = "Upcoming Events";

  eventsHeader.appendChild(title);

  return eventsHeader;
};

// Build the events grid container
export const buildEventsGrid = async () => {
  const eventsGrid = document.createElement("div");
  eventsGrid.id = "events-grid";
  eventsGrid.className = "events-grid";

  return eventsGrid;
};

// Build individual event card
export const buildEventCard = async (eventData) => {
  if (!eventData) return null;

  const eventCard = document.createElement("div");
  eventCard.className = "event-card";

  const eventImage = await buildEventImage(eventData);
  const eventContent = await buildEventContent(eventData);

  eventCard.append(eventImage, eventContent);

  return eventCard;
};

export const buildEventImage = async (eventData) => {
  if (!eventData || !eventData.picData) return null;
  const { filename } = eventData.picData;

  const eventImage = document.createElement("img");
  eventImage.className = "event-image";
  eventImage.alt = "No image available";

  const picPath = `/images/events/${filename}`;
  if (!picPath) return null;

  eventImage.src = picPath;

  return eventImage;
};

export const buildEventContent = async (eventData) => {
  if (!eventData) return null;
  const { name, eventDate, eventLocation, eventDescription } = eventData;

  const eventContentContainer = document.createElement("div");
  eventContentContainer.className = "event-content";

  const eventDateElement = document.createElement("div");
  eventDateElement.className = "event-date";
  eventDateElement.textContent = `📅 ${eventDate}`;

  const eventTitleElement = document.createElement("div");
  eventTitleElement.className = "event-title";
  eventTitleElement.textContent = name;

  const eventLocationElement = document.createElement("div");
  eventLocationElement.className = "event-location";
  eventLocationElement.textContent = `📍 ${eventLocation}`;

  const eventDescriptionElement = document.createElement("div");
  eventDescriptionElement.className = "event-description";
  eventDescriptionElement.textContent = eventDescription;

  eventContentContainer.append(eventDateElement, eventTitleElement, eventLocationElement, eventDescriptionElement);

  return eventContentContainer;
};
