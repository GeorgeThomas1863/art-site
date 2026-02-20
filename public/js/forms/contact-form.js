// Build the contact page
export const buildContactForm = async () => {
  const contactContainer = document.createElement("div");
  contactContainer.id = "contact-container";
  contactContainer.className = "contact-container";

  const contactHeader = await buildContactHeader();
  const contactCard = await buildContactCard();

  contactContainer.append(contactHeader, contactCard);

  return contactContainer;
};

// Build the page header
export const buildContactHeader = async () => {
  const contactHeader = document.createElement("div");
  contactHeader.className = "contact-page-header";

  const title = document.createElement("h1");
  title.className = "contact-page-title";
  title.textContent = "We'd love to hear from you!";

  contactHeader.append(title);

  return contactHeader;
};

// Build the contact card container
export const buildContactCard = async () => {
  const contactCard = document.createElement("div");
  contactCard.className = "contact-card";

  const contactFormContent = await buildContactFormContent();

  contactCard.appendChild(contactFormContent);

  return contactCard;
};

export const buildContactFormContent = async () => {
  const contactFormContent = document.createElement("div");
  contactFormContent.className = "contact-form-content";

  const form = await buildContactFormElement();

  contactFormContent.appendChild(form);

  return contactFormContent;
};

export const buildContactFormElement = async () => {
  const form = document.createElement("form");
  form.id = "contactForm";

  const nameGroup = await buildFormGroup("name", "Name", "text");
  const emailGroup = await buildFormGroup("email", "Email Address", "email");
  const subjectGroup = await buildFormGroup("subject", "Subject", "text");
  const subjectInput = subjectGroup.querySelector("input");
  subjectInput.required = false;
  subjectInput.maxLength = 200;
  const messageGroup = await buildFormGroup("message", "Message", "textarea");
  const newsletterSection = await buildNewsletterSection();
  const submitButton = await buildSubmitButton();

  form.append(nameGroup, emailGroup, subjectGroup, messageGroup, newsletterSection, submitButton);

  // Add form submit event listener
  // form.addEventListener("submit", handleFormSubmit);

  return form;
};

export const buildFormGroup = async (id, labelText, inputType) => {
  const formGroup = document.createElement("div");
  formGroup.className = "form-group";

  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = labelText;

  let input;
  if (inputType === "textarea") {
    input = document.createElement("textarea");
    input.id = id;
    input.name = id;
    input.required = true;
  } else {
    input = document.createElement("input");
    input.type = inputType;
    input.id = id;
    input.name = id;
    input.required = true;
  }

  formGroup.append(label, input);

  return formGroup;
};

//---------------

export const buildNewsletterSection = async () => {
  const newsletterSection = document.createElement("div");
  newsletterSection.className = "newsletter-section";

  const title = document.createElement("h2");
  title.className = "newsletter-title";
  title.textContent = "Join Our Newsletter";

  const description = document.createElement("p");
  description.className = "newsletter-description";
  description.textContent = "Stay updated with new creations, upcoming events, and special offers from Two Sisters Fiber Art.";

  const checkboxWrapper = await buildCheckboxWrapper();

  newsletterSection.append(title, description, checkboxWrapper);

  return newsletterSection;
};

// Build checkbox wrapper
export const buildCheckboxWrapper = async () => {
  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "checkbox-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "newsletter";
  checkbox.name = "newsletter";

  const label = document.createElement("label");
  label.setAttribute("for", "newsletter");
  label.textContent = "Yes, I want to receive newsletters and updates!";

  checkboxWrapper.append(checkbox, label);

  return checkboxWrapper;
};

// Build submit button
export const buildSubmitButton = async () => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "submit-button";
  button.textContent = "Send Message";
  button.setAttribute("data-label", "contact-submit");

  return button;
};
