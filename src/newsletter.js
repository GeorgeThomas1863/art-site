import { ObjectId } from "mongodb";
import { dbGet } from "../middleware/db-config.js";
import { sendMail } from "./mailer.js";
import { escapeHtml, sanitizeEmailHeader } from "./sanitize.js";
import dbModel from "../models/db-model.js";

const LOG_MODE_MESSAGE = "Email NOT sent: server is running with MAIL_MODE=log (logged to console only)";

const buildSendResult = (data, successMessage) => {
  if (data.mode === "log") return { success: true, message: LOG_MODE_MESSAGE, logMode: true, messageId: data.messageId };
  return { success: true, message: successMessage, messageId: data.messageId };
};

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
  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, html, message, buttonText, buttonUrl } = inputParams;
  const content = html || message;
  if (!content) return { success: false, message: "No message provided" };
  const validation = validateButton(buttonText, buttonUrl);
  if (!validation.success) return validation;

  const buttonHtml = buildButtonHtml(buttonText, buttonUrl);
  const baseHtml = html || (buttonHtml ? escapeHtml(message || "").replace(/\r?\n/g, "<br>") : "");
  const finalHtml = `${prepareNewsletterHtml(baseHtml) || ""}${buttonHtml}` || undefined;
  return sendPreparedNewsletter({
    subject: sanitizeEmailHeader(subject || ""),
    html: finalHtml,
    text: message || "Please view this email in an HTML-capable client.",
  });
};

export const sendTestNewsletter = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, html, message, buttonText, buttonUrl } = inputParams;
  const content = html || message;
  if (!content) return { success: false, message: "No message provided" };
  const validation = validateButton(buttonText, buttonUrl);
  if (!validation.success) return validation;

  const to = [process.env.EMAIL_RECIPIENT_1, process.env.EMAIL_RECIPIENT_2].filter(Boolean).join(", ");
  if (!to) return { success: false, message: "No recipient addresses configured" };
  const cleanSubject = sanitizeEmailHeader(subject || "");
  const buttonHtml = buildButtonHtml(buttonText, buttonUrl);
  const baseHtml = html || (buttonHtml ? escapeHtml(message || "").replace(/\r?\n/g, "<br>") : "");
  const finalHtml = `${prepareNewsletterHtml(baseHtml) || ""}${buttonHtml}` || undefined;

  const mailParams = {
    from: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    to,
    subject: `[TEST] ${cleanSubject}`,
    html: finalHtml,
    text: message || "Please view this email in an HTML-capable client.",
    replyTo: process.env.EMAIL_USER,
  };

  try {
    const data = await sendMail(mailParams);
    if (!data) return { success: false, message: "Failed to send test newsletter" };
    return buildSendResult(data, "Test newsletter sent successfully");
  } catch (e) {
    console.error("TEST EMAIL ERROR:", e.data?.message || e.message || "Unknown error");
    return { success: false, message: "Failed to send test newsletter" };
  }
};

export const announceProduct = async (product, options = {}) => {
  if (!product) return { success: false, message: "No product provided", subscriberCount: 0 };
  const { buttonText, buttonUrl } = resolveProductButton(product, options);
  const validation = validateButton(buttonText, buttonUrl);
  if (!validation.success) return { ...validation, subscriberCount: 0 };

  const mailParams = buildProductMailParams(product, buttonText, buttonUrl);
  return sendPreparedNewsletter(mailParams, true);
};

const sendPreparedNewsletter = async (inputParams, includeSubscriberCount = false) => {
  const subscriberArray = await getSubscribers();
  if (!subscriberArray || !subscriberArray.length) {
    const result = { success: false, message: "No subscribers found" };
    if (includeSubscriberCount) result.subscriberCount = 0;
    return result;
  }

  const mailParams = buildSubscriberMailParams(inputParams, subscriberArray);
  const data = await sendSubscriberMail(mailParams);
  if (!data) return buildSendFailure(includeSubscriberCount, subscriberArray.length);

  const archiveData = await storeSentNewsletter(mailParams, data);
  const successMessage = archiveData.success ? "Newsletter sent successfully" : archiveData.message;
  const result = buildSendResult(data, successMessage);
  if (includeSubscriberCount) result.subscriberCount = subscriberArray.length;
  return result;
};

const buildSubscriberMailParams = (inputParams, subscriberArray) => {
  const emailList = [];
  for (const subscriber of subscriberArray) emailList.push(subscriber.email);
  if (process.env.EMAIL_RECIPIENT_1) emailList.push(process.env.EMAIL_RECIPIENT_1);
  if (process.env.EMAIL_RECIPIENT_2) emailList.push(process.env.EMAIL_RECIPIENT_2);
  return {
    from: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    to: process.env.NEWSLETTER_FROM || process.env.EMAIL_USER,
    bcc: emailList.join(", "),
    subject: inputParams.subject,
    html: inputParams.html,
    text: inputParams.text,
    replyTo: process.env.EMAIL_USER,
  };
};

const sendSubscriberMail = async (mailParams) => {
  try {
    const data = await sendMail(mailParams);
    return data || null;
  } catch (e) {
    console.error("NEWSLETTER EMAIL ERROR:", e.data?.message || e.message || "Unknown error");
    return null;
  }
};

const storeSentNewsletter = async (mailParams, data) => {
  const storeParams = { ...mailParams, emailData: data, messageId: data.messageId };
  try {
    const storeModel = new dbModel(storeParams, process.env.NEWSLETTER_COLLECTION);
    await storeModel.storeAny();
    return { success: true, message: "Newsletter archived" };
  } catch (e) {
    console.error(`NEWSLETTER ARCHIVE ERROR for ${data.messageId}:`, e.message || e);
    return { success: false, message: "Newsletter sent, but archiving a copy failed" };
  }
};

const buildSendFailure = (includeSubscriberCount, subscriberCount) => {
  const result = { success: false, message: "Failed to send newsletter" };
  if (includeSubscriberCount) result.subscriberCount = subscriberCount;
  return result;
};

const prepareNewsletterHtml = (html) => {
  if (!html) return html;
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
  let resolvedHtml = html;
  if (siteUrl) resolvedHtml = resolvedHtml.replace(/(<img\b[^>]*\ssrc=["'])(?:https?:\/\/[^/]+)?(\/images\/newsletter\/)/gi, `$1${siteUrl}$2`);
  resolvedHtml = resolvedHtml.replace(/<img\b(?![^>]*\bstyle=)/gi, '<img style="max-width: 100%; height: auto; display: block;" width="600"');
  return resolvedHtml.replace(/<p\b(?![^>]*\bstyle=)/gi, '<p style="margin: 0 0 1em 0;"');
};

export const validateButton = (text, url) => {
  const cleanText = typeof text === "string" ? text.trim() : "";
  const cleanUrl = typeof url === "string" ? url.trim() : "";
  if (!cleanText && !cleanUrl) return { success: true, message: "" };
  if (!cleanText || !cleanUrl) return { success: false, message: "Button text and link are both required" };
  if (!/^https?:\/\//i.test(cleanUrl)) return { success: false, message: "Button link must start with http:// or https://" };
  return { success: true, message: "" };
};

export const buildButtonHtml = (text, url) => {
  const validation = validateButton(text, url);
  if (!validation.success || !text?.trim() || !url?.trim()) return "";
  const safeText = escapeHtml(text.trim());
  const safeUrl = escapeHtml(url.trim());
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;"><tr><td align="center"><a href="${safeUrl}" target="_blank" style="display:inline-block; padding:12px 28px; background:#333333; color:#ffffff; text-decoration:none; border-radius:4px; font-weight:bold;">${safeText}</a></td></tr></table>`;
};

const resolveProductButton = (product, options) => {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "") || "";
  const defaultUrl = `${siteUrl}/products/${product.urlName || ""}`;
  const buttonText = typeof options.buttonText === "string" && options.buttonText.trim() ? options.buttonText.trim() : "View Product";
  const buttonUrl = typeof options.buttonUrl === "string" && options.buttonUrl.trim() ? options.buttonUrl.trim() : defaultUrl;
  return { buttonText, buttonUrl };
};

const buildProductMailParams = (product, buttonText, buttonUrl) => {
  const name = escapeHtml(String(product.name || ""));
  const description = escapeHtml(String(product.description || "")).replace(/\r?\n/g, "<br>");
  const price = Number(product.price);
  const priceText = Number.isFinite(price) ? `$${price.toFixed(2)}` : "$0.00";
  const imageHtml = buildProductImageHtml(product.picData);
  const html = `<div style="max-width:600px; margin:0 auto;"><h1>${name}</h1>${imageHtml}<p style="margin:0 0 1em 0;">${escapeHtml(priceText)}</p><p style="margin:0 0 1em 0;">${description}</p>${buildButtonHtml(buttonText, buttonUrl)}</div>`;
  const text = `${product.name || ""}\n${priceText}\n${product.description || ""}\n${buttonUrl}`;
  return { subject: sanitizeEmailHeader(`New Product: ${product.name || ""}`), html, text };
};

const buildProductImageHtml = (picData) => {
  const filename = picData?.[0]?.filename;
  if (!filename || /\.(mp4|webm|mov)$/i.test(filename)) return "";
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "") || "";
  const safeSrc = escapeHtml(`${siteUrl}/images/products/${filename}`);
  return `<img src="${safeSrc}" style="max-width: 100%; height: auto; display: block;" width="600">`;
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
