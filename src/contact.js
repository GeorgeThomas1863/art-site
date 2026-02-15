import nodemailer from "nodemailer";
import dbModel from "../models/db-model.js";
import { storeSubscriber } from "./newsletter.js";
import { escapeHtml, sanitizeEmailHeader, validateEmail } from "./sanitize.js";

export const runContactSubmit = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };

  console.log("RUN CONTACT SUBMIT");
  console.log("INPUT PARAMS");
  console.log(inputParams);

  const { name, email, subject, message, newsletter } = inputParams;

  if (!validateEmail(email)) {
    return { success: false, message: "Invalid email address" };
  }

  if (newsletter) {
    const newsletterData = await storeSubscriber(email);
    if (!newsletterData || !newsletterData.success) {
      if (newsletterData.message !== "Email already subscribed") {
        return { success: false, message: "Failed to add email to newsletter" };
      }
    }
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", "),
    subject: `SITE MESSAGE FROM ${sanitizeEmailHeader(name)} | SUBJECT: ${sanitizeEmailHeader(subject)}`,
    html: `
      <h4>NEW CONTACT FORM SUBMISSION:</h4>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Subject:</strong> ${safeSubject || "No subject provided"}</p>
      <p><strong>Message:</strong> ${safeMessage}</p>`,

    replyTo: sanitizeEmailHeader(email),
  };

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    const data = await transport.sendMail(mailParams);
    console.log("EMAIL SENT:", data);
    if (!data) return { success: false, message: "Failed to send email" };

    mailParams.emailData = data;
    mailParams.messageId = data.messageId;
    mailParams.newsletter = newsletter;

    const storeModel = new dbModel(mailParams, process.env.CONTACTS_COLLECTION);
    const storeData = await storeModel.storeAny();
    if (!storeData) return { success: false, message: "Failed to store email data" };

    return { success: true, message: "Email sent successfully", messageId: data.messageId };
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return { success: false, message: "Failed to send email" };
  }
};
