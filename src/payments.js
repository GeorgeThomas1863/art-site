import SQ from "../middleware/square-config.js";
import { randomUUID } from "crypto";

export const processPayment = async (cost, inputParams) => {
  if (!cost || !inputParams) return null;
  const { paymentToken, address, city, state, zip, firstName, lastName, email } = inputParams;

  //INSERT TAX CLOUD API HERE
  const taxRate = 0.08;
  const tax = cost * taxRate;
  const totalCost = cost + tax;

  const costInCents = Math.round(totalCost * 100);

  const paymentParams = {
    sourceId: paymentToken,
    idempotencyKey: randomUUID(), //maybe change
    amountMoney: {
      amount: BigInt(costInCents),
      currency: "USD",
    },
    locationId: process.env.SQUARE_LOCATION_ID, //SET FOR PROD
    buyerEmailAddress: email,
    billingAddress: {
      addressLine1: address,
      locality: city,
      administrativeDistrictLevel1: state,
      postalCode: zip,
      firstName: firstName,
      lastName: lastName,
    },
    note: `Order from ${firstName} ${lastName} for ${totalCost}`,
  };

  console.log("PAYMENT PARAMS");
  console.log(paymentParams);

  const data = await SQ.payments.create(paymentParams);
  console.log("PAYMENT RESPONSE");
  console.log(data);

  //throw error?
  if (!data || !data.payment) {
    console.error("PAYMENT FAILED WHEN SENT TO SQUARE");
    console.error(res);
    return null;
  }
  data.success = true;

  //maybe send entire payment obj back
  return data;
};
