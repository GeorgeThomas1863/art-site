export const buildNewsletterForm = () => {
  const container = document.createElement("div");
  container.className = "newsletter-container";

  const header = buildNewsletterHeader();
  const signupSection = buildNewsletterSignupSection();
  const controls = buildNewsletterControls();
  const displayArea = buildNewsletterDisplayArea();

  container.append(header, controls, displayArea, signupSection);
  return container;
};

const buildNewsletterHeader = () => {
  const header = document.createElement("div");
  header.className = "newsletter-page-header";

  const title = document.createElement("h1");
  title.className = "newsletter-page-title";
  title.textContent = "Newsletter Archive";

  header.append(title);
  return header;
};

const buildNewsletterControls = () => {
  const controls = document.createElement("div");
  controls.className = "newsletter-controls hidden";
  controls.id = "newsletter-controls";

  const select = document.createElement("select");
  select.className = "newsletter-select";
  select.id = "newsletter-select";
  select.setAttribute("data-label", "newsletter-select");

  controls.append(select);
  return controls;
};

const buildNewsletterDisplayArea = () => {
  const area = document.createElement("div");
  area.className = "newsletter-display-area";
  area.id = "newsletter-display-area";
  return area;
};

const buildNewsletterSignupSection = () => {
  const section = document.createElement("div");
  section.className = "newsletter-signup-section";

  const title = document.createElement("h2");
  title.className = "newsletter-signup-title";
  title.textContent = "Join Our Newsletter";

  const description = document.createElement("p");
  description.className = "newsletter-signup-description";
  description.textContent = "Stay updated with new creations, upcoming events, and special offers from Two Sisters Fiber Art.";

  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "newsletter-signup-checkbox-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "newsletter-signup-checkbox";
  checkbox.name = "newsletter-signup-checkbox";
  checkbox.setAttribute("data-label", "newsletter-signup-checkbox");

  const label = document.createElement("label");
  label.setAttribute("for", "newsletter-signup-checkbox");
  label.textContent = "Yes, I want to receive newsletters and updates!";

  checkboxWrapper.append(checkbox, label);

  const emailWrapper = document.createElement("div");
  emailWrapper.id = "newsletter-signup-email-wrapper";
  emailWrapper.className = "newsletter-signup-email-wrapper hidden";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.id = "newsletter-signup-email";
  emailInput.name = "newsletter-signup-email";
  emailInput.placeholder = "Enter your email address";
  emailInput.className = "newsletter-signup-email-input";

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "newsletter-signup-submit-btn";
  submitBtn.textContent = "Subscribe";
  submitBtn.setAttribute("data-label", "newsletter-signup-submit");

  emailWrapper.append(emailInput, submitBtn);
  section.append(title, description, checkboxWrapper, emailWrapper);
  return section;
};
