let newsletterArchive = [];

export const populateNewsletter = (data) => {
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
  displayNewsletterItem(newsletterArchive[0]);
};

export const runNewsletterSelect = (selectElement) => {
  const idx = parseInt(selectElement.value, 10);
  if (isNaN(idx) || idx < 0 || idx >= newsletterArchive.length) return;
  displayNewsletterItem(newsletterArchive[idx]);
};

const displayNewsletterItem = (newsletter) => {
  const displayArea = document.getElementById("newsletter-display-area");
  if (!displayArea) return;
  displayArea.innerHTML = "";
  displayArea.append(buildNewsletterCard(newsletter));
};

const buildNewsletterCard = (newsletter) => {
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

  const body = document.createElement("div");
  body.className = "newsletter-card-body";

  const text = document.createElement("p");
  text.className = "newsletter-card-text";
  text.textContent = newsletter.text;

  body.append(text);
  card.append(cardHeader, body);
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

const formatDate = (sentAt) => {
  if (!sentAt) return "";
  const date = new Date(sentAt);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
