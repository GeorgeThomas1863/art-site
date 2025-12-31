import squareClient from "../config/square-client.js";
import { randomUUID } from "crypto";

export const processPayment = async (totalCost, inputParams) => {
  if (!totalCost || !inputParams) return null;
  const { paymentToken, address, city, state, zip, firstName, lastName } = inputParams;

  const costInCents = Math.round(totalCost * 100);

  const paymentParams = {
    sourceId: paymentToken,
    idempotencyKey: randomUUID(), //maybe change
    amountMoney: {
      amount: BigInt(costInCents),
      currency: "USD",
    },
    buyerEmailAddress: customerData.email,
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

  const res = await squareClient.paymentsApi.createPayment(paymentParams);

  console.log("PAYMENT RESPONSE");
  console.log(res);

  //throw error?
  if (!res || !res.result || !res.result.payment) {
    console.error("PAYMENT FAILED WHEN SENT TO SQUARE");
    console.error(res);
    return null;
  }

  //maybe send entire payment obj back
  return { success: true, paymentId: res.result.payment.id, paymentStatus: res.result.payment.status };
};
