import nodemailer from "nodemailer";
import dbModel from "../models/db-model.js";
import { runAddToNewsletter } from "./newsletter.js";

export const runContactSubmit = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };

  console.log("RUN CONTACT SUBMIT");
  console.log("INPUT PARAMS");
  console.log(inputParams);

  const { name, email, subject, message, newsletter } = inputParams;

  if (newsletter) {
    const newsletterData = await runAddToNewsletter(email);
    if (!newsletterData || !newsletterData.success) {
      if (newsletterData.message !== "Email already subscribed") {
        return { success: false, message: "Failed to add email to newsletter" };
      }
    }
  }

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: `SITE MESSAGE FROM ${name} | SUBJECT: ${subject}`,
    html: `
      <h4>NEW CONTACT FORM SUBMISSION:</h4>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
      <p><strong>Message:</strong> ${message.replace(/\n/g, "<br>")}</p>`,

    replyTo: email,
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
