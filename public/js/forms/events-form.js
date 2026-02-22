// Build the events page
export const buildEventsForm = async () => {
  const eventsContainer = document.createElement("div");
  eventsContainer.id = "events-container";
  eventsContainer.className = "events-container";

  const eventsHeader = await buildEventsHeader();
  const eventsGrid = await buildEventsGrid();
  const newsletterSection = await buildEventsNewsletterSection();

  eventsContainer.append(eventsHeader, eventsGrid, newsletterSection);

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

  if (eventImage) eventCard.append(eventImage);
  eventCard.append(eventContent);

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
  const [year, month, day] = eventDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  eventDateElement.textContent = `📅 ${formatted}`;

  const eventTitleElement = document.createElement("div");
  eventTitleElement.className = "event-title";
  eventTitleElement.textContent = name;

  const eventLocationElement = document.createElement("div");
  eventLocationElement.className = "event-location";

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(eventLocation)}`;
  const locationLink = document.createElement("a");
  locationLink.href = mapsUrl;
  locationLink.target = "_blank";
  locationLink.rel = "noopener noreferrer";
  locationLink.className = "event-location-link";
  locationLink.textContent = `📍 ${eventLocation}`;

  eventLocationElement.appendChild(locationLink);

  const eventDescriptionElement = document.createElement("div");
  eventDescriptionElement.className = "event-description";
  eventDescriptionElement.textContent = eventDescription;

  eventContentContainer.append(eventDateElement, eventTitleElement, eventLocationElement, eventDescriptionElement);

  return eventContentContainer;
};

export const buildEventsNewsletterSection = async () => {
  const newsletterSection = document.createElement("div");
  newsletterSection.className = "events-newsletter-section";

  const title = document.createElement("h2");
  title.className = "events-newsletter-title";
  title.textContent = "Join Our Newsletter";

  const description = document.createElement("p");
  description.className = "events-newsletter-description";
  description.textContent = "Stay updated with new creations, upcoming events, and special offers from Two Sisters Fiber Art.";

  const checkboxWrapper = await buildEventsNewsletterCheckbox();
  const emailInputWrapper = await buildEventsNewsletterEmailInput();

  newsletterSection.append(title, description, checkboxWrapper, emailInputWrapper);

  return newsletterSection;
};

// Build checkbox wrapper for newsletter
export const buildEventsNewsletterCheckbox = async () => {
  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "events-newsletter-checkbox-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "events-newsletter";
  checkbox.name = "events-newsletter";
  checkbox.setAttribute("data-label", "events-newsletter-checkbox");

  const label = document.createElement("label");
  label.setAttribute("for", "events-newsletter");
  label.textContent = "Yes, I want to receive newsletters and updates!";
  label.setAttribute("data-label", "events-newsletter-checkbox");

  checkboxWrapper.append(checkbox, label);

  return checkboxWrapper;
};

export const buildEventsNewsletterEmailInput = async () => {
  const emailWrapper = document.createElement("div");
  emailWrapper.id = "events-newsletter-email-wrapper";
  emailWrapper.className = "events-newsletter-email-wrapper hidden";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.id = "events-newsletter-email";
  emailInput.name = "events-newsletter-email";
  emailInput.placeholder = "Enter your email address";
  emailInput.className = "events-newsletter-email-input";

  const submitButton = document.createElement("button");
  submitButton.type = "button";
  submitButton.className = "events-newsletter-submit-btn";
  submitButton.textContent = "Subscribe";
  submitButton.setAttribute("data-label", "events-newsletter-submit");

  emailWrapper.append(emailInput, submitButton);

  return emailWrapper;
};
