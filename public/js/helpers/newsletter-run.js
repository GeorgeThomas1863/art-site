import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";
import { buildCollapseContainer } from "../util/collapse.js";

let newsletterArchive = [];

export const populateNewsletter = async (data) => {
  newsletterArchive = data || [];

  const displayArea = document.getElementById("newsletter-display-area");
  const controls = document.getElementById("newsletter-controls");
  if (!displayArea) return;

  if (!newsletterArchive.length) {
    displayArea.append(buildEmptyState());
    return;
  }

  const select = document.getElementById("newsletter-select");
  for (let i = 0; i < newsletterArchive.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = formatOptionLabel(newsletterArchive[i]);
    select.append(option);
  }

  controls.classList.remove("hidden");
  await displayNewsletterItem(newsletterArchive[0]);
};

export const runNewsletterSelect = async (selectElement) => {
  const idx = parseInt(selectElement.value, 10);
  if (isNaN(idx) || idx < 0 || idx >= newsletterArchive.length) return;
  await displayNewsletterItem(newsletterArchive[idx]);
};

const displayNewsletterItem = async (newsletter) => {
  const displayArea = document.getElementById("newsletter-display-area");
  if (!displayArea) return;
  displayArea.innerHTML = "";
  displayArea.append(await buildNewsletterCard(newsletter));
};

const buildNewsletterCard = async (newsletter) => {
  const card = document.createElement("div");
  card.className = "newsletter-card";

  const cardHeader = document.createElement("div");
  cardHeader.className = "newsletter-card-header";

  const subject = document.createElement("h2");
  subject.className = "newsletter-card-subject";
  subject.textContent = newsletter.subject;

  const date = document.createElement("p");
  date.className = "newsletter-card-date";
  date.textContent = formatDate(newsletter.sentAt);

  cardHeader.append(subject, date);

  const collapseWrapper = document.createElement("div");

  const body = document.createElement("div");
  body.className = "newsletter-card-body";
  if (newsletter.html) {
    body.innerHTML = newsletter.html;
  } else if (newsletter.text) {
    const textEl = document.createElement("p");
    textEl.textContent = newsletter.text;
    body.append(textEl);
  }
  collapseWrapper.append(body);

  const collapseContainer = await buildCollapseContainer({
    titleElement: cardHeader,
    contentElement: collapseWrapper,
    isExpanded: true,
  });

  card.append(collapseContainer);
  return card;
};

const buildEmptyState = () => {
  const empty = document.createElement("div");
  empty.className = "newsletter-empty-state";

  const msg = document.createElement("p");
  msg.className = "newsletter-empty-message";
  msg.textContent = "No newsletters have been sent yet.";

  empty.append(msg);
  return empty;
};

const formatOptionLabel = (newsletter) => {
  const subject =
    newsletter.subject.length > 50
      ? newsletter.subject.slice(0, 50) + "\u2026"
      : newsletter.subject;
  return `${subject} \u2014 ${formatDate(newsletter.sentAt)}`;
};

export const runNewsletterSignupToggle = (clickElement) => {
  const emailWrapper = document.getElementById("newsletter-signup-email-wrapper");
  if (!emailWrapper) return null;

  if (clickElement.checked) {
    emailWrapper.classList.remove("hidden");
    return true;
  }

  emailWrapper.classList.add("hidden");
  return true;
};

export const runNewsletterSignupSubmit = async () => {
  const emailInput = document.getElementById("newsletter-signup-email");
  if (!emailInput) return null;

  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    await displayPopup("Please enter a valid email address", "error");
    return null;
  }

  const params = { route: "/newsletter/add", email };
  const data = await sendToBack(params);

  if (!data || !data.success) {
    await displayPopup("Failed to subscribe. Please try again.", "error");
    return null;
  }

  if (data.duplicate) {
    await displayPopup(`${data.email} is already subscribed to our newsletter!`, "error");
    return null;
  }

  await displayPopup("Successfully subscribed to our newsletter!", "success");

  emailInput.value = "";
  const checkbox = document.getElementById("newsletter-signup-checkbox");
  if (checkbox) checkbox.checked = false;

  const emailWrapper = document.getElementById("newsletter-signup-email-wrapper");
  if (emailWrapper) emailWrapper.classList.add("hidden");

  return true;
};

const formatDate = (sentAt) => {
  if (!sentAt) return "";
  const date = new Date(sentAt);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
