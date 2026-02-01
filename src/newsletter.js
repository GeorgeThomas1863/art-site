import dbModel from "../models/db-model.js";

export const runAddToNewsletter = async (email) => {
  if (!email) return { success: false, message: "No email provided" };

  console.log("RUN ADD TO NEWSLETTER");
  console.log("EMAIL");
  console.log(email);

  const checkModel = new dbModel({ keyToLookup: "email", itemValue: email }, process.env.NEWSLETTER_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (checkData) return { success: true, message: "Email already subscribed", email: email };

  const newsletterModel = new dbModel({ email: email }, process.env.NEWSLETTER_COLLECTION);
  const newsletterData = await newsletterModel.storeAny();
  if (!newsletterData) return { success: false, message: "Failed to add email to newsletter" };
  newsletterData.success = true;
  newsletterData.message = "Email added to newsletter";
  return newsletterData;
};
