import { ObjectId } from "mongodb";
import { dbGet } from "../middleware/db-config.js";
import { sendMail } from "./mailer.js";
import { sanitizeEmailHeader } from "./sanitize.js";
import dbModel from "../models/db-model.js";

export const getSubscribers = async () => {
  const dataModel = new dbModel("", process.env.SUBSCRIBERS_COLLECTION);
  const data = await dataModel.getAll();
  return data;
};

export const storeSubscriber = async (email) => {
  if (!email) return { success: false, message: "No email provided" };

  // console.log("RUN ADD SUBSCRIBER");
  // console.log("EMAIL");
  // console.log(email);

  const checkModel = new dbModel({ keyToLookup: "email", itemValue: email }, process.env.SUBSCRIBERS_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (checkData) return { success: true, duplicate: true, message: "Email already subscribed", email: email };

  const subscriberModel = new dbModel({ email: email, date: new Date() }, process.env.SUBSCRIBERS_COLLECTION);
  const subscriberData = await subscriberModel.storeAny();
  if (!subscriberData) return { success: false, message: "Failed to add email to newsletter" };
  subscriberData.success = true;
  subscriberData.message = "Email added to newsletter";
  return subscriberData;
};

export const notifyAdminOfSubscription = async (email) => {
  const to = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", ");
  if (!to) return;
  await sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "New Newsletter Subscriber",
    text: `A new user subscribed to the newsletter:\n\n${email}`,
  });
};

export const deleteSubscriber = async (email) => {
  if (!email) return { success: false, message: "No email provided" };

  const removeModel = new dbModel({ keyToLookup: "email", itemValue: email }, process.env.SUBSCRIBERS_COLLECTION);
  const removeData = await removeModel.deleteItem();
  if (!removeData) return { success: false, message: "Failed to remove email from newsletter" };
  removeData.success = true;
  removeData.message = "Email removed from newsletter";
  return removeData;
};

export const getNewsletters = async () => {
  const dataModel = new dbModel("", process.env.NEWSLETTER_COLLECTION);
  const all = await dataModel.getAll();
  if (!all || !all.length) return [];

  all.sort((a, b) => (b._id > a._id ? 1 : -1));

  const result = [];
  for (const n of all) {
    result.push({
      id: n._id.toString(),
      subject: n.subject || "(No Subject)",
      html: n.html || "",
      text: n.text || "",
      sentAt: n._id.getTimestamp(),
    });
  }
  return result;
};

export const dispatchNewsletter = async (inputParams) => {
  // console.log("DISPATCH NEWSLETTER");
  // console.dir(inputParams);

  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, html, message } = inputParams;
  const content = html || message;
  if (!content) return { success: false, message: "No message provided" };
  const cleanSubject = sanitizeEmailHeader(subject || "");

  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  let resolvedHtml = html;
  if (siteUrl && resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/(<img\b[^>]*\ssrc=["'])https?:\/\/[^/]+(\/images\/newsletter\/)/gi, `$1${siteUrl}$2`);
  }
  if (resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/<img\b(?![^>]*\bstyle=)/gi, '<img style="max-width: 100%; height: auto; display: block;" width="600"');
  }
  if (resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/<p\b(?![^>]*\bstyle=)/gi, '<p style="margin: 0 0 1em 0;"');
  }

  const subscriberArray = await getSubscribers();
  if (!subscriberArray || !subscriberArray.length) return { success: false, message: "No subscribers found" };

  const emailList = [];
  for (let i = 0; i < subscriberArray.length; i++) {
    emailList.push(subscriberArray[i].email);
  }

  const mailParams = {
    from: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    to: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    bcc: [...emailList, process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", "),
    subject: cleanSubject,
    html: resolvedHtml || undefined,
    text: message || "Please view this email in an HTML-capable client.",
    replyTo: process.env.EMAIL_USER,
  };

  // console.log("MAIL PARAMS");
  // console.dir(mailParams);

  try {
    const data = await sendMail(mailParams);
    if (!data) return { success: false, message: "Failed to send newsletter" };

    const storeParams = { ...mailParams, emailData: data, messageId: data.messageId };
    const storeModel = new dbModel(storeParams, process.env.NEWSLETTER_COLLECTION);
    await storeModel.storeAny();

    return { success: true, message: "Newsletter sent successfully", messageId: data.messageId };
  } catch (e) {
    console.error("EMAIL ERROR:", e.data?.message || e.message || "Unknown error");
    return { success: false, message: "Failed to send newsletter" };
  }
};

export const sendTestNewsletter = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, html, message } = inputParams;
  const content = html || message;
  if (!content) return { success: false, message: "No message provided" };

  const to = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", ");
  if (!to) return { success: false, message: "No recipient addresses configured" };

  const cleanSubject = sanitizeEmailHeader(subject || "");

  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  let resolvedHtml = html;
  if (siteUrl && resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/(<img\b[^>]*\ssrc=["'])https?:\/\/[^/]+(\/images\/newsletter\/)/gi, `$1${siteUrl}$2`);
  }
  if (resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/<img\b(?![^>]*\bstyle=)/gi, '<img style="max-width: 100%; height: auto; display: block;" width="600"');
  }
  if (resolvedHtml) {
    resolvedHtml = resolvedHtml.replace(/<p\b(?![^>]*\bstyle=)/gi, '<p style="margin: 0 0 1em 0;"');
  }

  const mailParams = {
    from: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    to,
    subject: `[TEST] ${cleanSubject}`,
    html: resolvedHtml || undefined,
    text: message || "Please view this email in an HTML-capable client.",
    replyTo: process.env.EMAIL_USER,
  };

  try {
    const data = await sendMail(mailParams);
    if (!data) return { success: false, message: "Failed to send test newsletter" };
    return { success: true, message: "Test newsletter sent successfully", messageId: data.messageId };
  } catch (e) {
    console.error("TEST EMAIL ERROR:", e.data?.message || e.message || "Unknown error");
    return { success: false, message: "Failed to send test newsletter" };
  }
};

export const deleteNewsletter = async (id) => {
  if (!id || typeof id !== "string") return { success: false, message: "No ID provided" };
  try {
    const result = await dbGet().collection(process.env.NEWSLETTER_COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (!result || result.deletedCount === 0) return { success: false, message: "Newsletter not found" };
    return { success: true, message: "Newsletter deleted successfully" };
  } catch (e) {
    return { success: false, message: "Invalid newsletter ID" };
  }
};

export const updateNewsletter = async (id, html) => {
  if (!id || typeof id !== "string") return { success: false, message: "No ID provided" };
  if (!html || typeof html !== "string") return { success: false, message: "No content provided" };
  try {
    const result = await dbGet().collection(process.env.NEWSLETTER_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: { html } }
    );
    if (!result || result.matchedCount === 0) return { success: false, message: "Newsletter not found" };
    return { success: true, message: "Newsletter updated successfully" };
  } catch (e) {
    return { success: false, message: "Invalid newsletter ID" };
  }
};
