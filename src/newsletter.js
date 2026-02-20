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
  if (checkData) return { success: true, message: "Email already subscribed", email: email };

  const subscriberModel = new dbModel({ email: email }, process.env.SUBSCRIBERS_COLLECTION);
  const subscriberData = await subscriberModel.storeAny();
  if (!subscriberData) return { success: false, message: "Failed to add email to newsletter" };
  subscriberData.success = true;
  subscriberData.message = "Email added to newsletter";
  return subscriberData;
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

export const dispatchNewsletter = async (inputParams) => {
  // console.log("DISPATCH NEWSLETTER");
  // console.dir(inputParams);

  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, message } = inputParams;
  if (!message) return { success: false, message: "No message provided" };
  const cleanSubject = sanitizeEmailHeader(subject || "");

  const subscriberArray = await getSubscribers();
  if (!subscriberArray || !subscriberArray.length) return { success: false, message: "No subscribers found" };

  const emailList = subscriberArray.map((s) => s.email);

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    bcc: emailList,
    subject: cleanSubject,
    text: message,
  };

  console.log("MAIL PARAMS");
  console.dir(mailParams);

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
