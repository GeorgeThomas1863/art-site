import nodemailer from "nodemailer";
import dbModel from "../models/db-model.js";

export const runGetSubscribers = async () => {
  const dataModel = new dbModel("", process.env.SUBSCRIBERS_COLLECTION);
  const data = await dataModel.getAll();
  return data;
};

export const runAddSubscriber = async (email) => {
  if (!email) return { success: false, message: "No email provided" };

  console.log("RUN ADD SUBSCRIBER");
  console.log("EMAIL");
  console.log(email);

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

export const runRemoveSubscriber = async (email) => {
  if (!email) return { success: false, message: "No email provided" };

  const removeModel = new dbModel({ keyToLookup: "email", itemValue: email }, process.env.SUBSCRIBERS_COLLECTION);
  const removeData = await removeModel.deleteItem();
  if (!removeData) return { success: false, message: "Failed to remove email from newsletter" };
  removeData.success = true;
  removeData.message = "Email removed from newsletter";
  return removeData;
};

export const runSendNewsletter = async (inputParams) => {
  if (!inputParams) return { success: false, message: "No input parameters" };
  const { subject, message } = inputParams;
  if (!subject || !message) return { success: false, message: "No subject or message provided" };

  const subscriberArray = await runGetSubscribers();
  if (!subscriberArray || !subscriberArray.length) return { success: false, message: "No subscribers found" };

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailList = subscriberArray.map((s) => s.email);

  const mailParams = {
    from: process.env.EMAIL_USER,
    bcc: emailList,
    subject: subject,
    text: message,
  };

  try {
    const data = await transport.sendMail(mailParams);
    if (!data) return { success: false, message: "Failed to send newsletter" };

    const storeParams = { ...mailParams, emailData: data, messageId: data.messageId };
    const storeModel = new dbModel(storeParams, process.env.NEWSLETTER_COLLECTION);
    await storeModel.storeAny();

    return { success: true, message: "Newsletter sent successfully", messageId: data.messageId };
  } catch (e) {
    console.error("EMAIL ERROR:", e);
    return { success: false, message: "Failed to send newsletter" };
  }
};
