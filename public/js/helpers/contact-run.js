import { buildContactParams } from "../util/params.js";
import { sendToBack } from "../util/api-front.js";
import { displayPopup } from "../util/popup.js";

export const runContactSubmit = async () => {
  const contactParams = await buildContactParams();
  console.log("CONTACT PARAMS:");
  console.dir(contactParams);

  if (!contactParams || !contactParams.name || !contactParams.email || !contactParams.message) {
    await displayPopup("Please fill in all fields before submitting", "error");
    return null;
  }

  const email = contactParams.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    await displayPopup("Please enter a valid email address", "error");
    return null;
  }

  const data = await sendToBack(contactParams);
  console.log("CONTACT DATA:");
  console.dir(data);

  if (!data || !data.success) {
    await displayPopup("Failed to send message. Please try again.", "error");
    return null;
  }

  await displayPopup("Message sent! We'll get back to you soon.", "success");

  const form = document.getElementById("contactForm");
  if (form) form.reset();

  const newsletterCheckbox = document.getElementById("newsletter");
  if (newsletterCheckbox) newsletterCheckbox.checked = false;

  return true;
};
