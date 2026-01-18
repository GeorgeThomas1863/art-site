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
export const buildEventCard = async (event) => {
  const eventCard = document.createElement("div");
  eventCard.className = "event-card";

  const eventImage = document.createElement("div");
  eventImage.className = "event-image";
  // Use picData.filename to construct image path
  if (event.picData && event.picData.filename) {
    eventImage.style.backgroundImage = `url('/images/events/${event.picData.filename}')`;
    eventImage.style.backgroundSize = "cover";
    eventImage.style.backgroundPosition = "center";
  } else {
    eventImage.textContent = "[Event Image]";
  }

  const eventContent = document.createElement("div");
  eventContent.className = "event-content";

  const eventDate = document.createElement("div");
  eventDate.className = "event-date";
  eventDate.textContent = `📅 ${event.eventDate}`;

  const eventTitle = document.createElement("div");
  eventTitle.className = "event-title";
  eventTitle.textContent = event.name;

  const eventLocation = document.createElement("div");
  eventLocation.className = "event-location";
  eventLocation.textContent = `📍 ${event.eventLocation}`;

  const eventDescription = document.createElement("div");
  eventDescription.className = "event-description";
  eventDescription.textContent = event.eventDescription;

  eventContent.append(eventDate, eventTitle, eventLocation, eventDescription);
  eventCard.append(eventImage, eventContent);

  return eventCard;
};
