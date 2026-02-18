import SQ from "../middleware/square-config.js";
import { randomUUID } from "crypto";

export const processPayment = async (totalInCents, inputParams) => {
  if (!totalInCents || !inputParams) return null;
  const { paymentToken, address, city, state, zip, firstName, lastName, email } = inputParams;

  const paymentParams = {
    sourceId: paymentToken,
    idempotencyKey: randomUUID(),
    amountMoney: {
      amount: BigInt(totalInCents),
      currency: "USD",
    },
    locationId: process.env.SQUARE_LOCATION_ID,
    buyerEmailAddress: email,
    billingAddress: {
      addressLine1: address,
      locality: city,
      administrativeDistrictLevel1: state,
      postalCode: zip,
      firstName: firstName,
      lastName: lastName,
    },
    note: `Order from ${firstName} ${lastName} — $${(totalInCents / 100).toFixed(2)}`,
  };

  // console.log("PAYMENT PARAMS");
  // console.log(paymentParams);

  const data = await SQ.payments.create(paymentParams);
  // console.log("PAYMENT RESPONSE");
  // console.log(data);

  if (!data || !data.payment) {
    console.error("PAYMENT FAILED WHEN SENT TO SQUARE");
    console.error(data);
    return null;
  }
  data.success = true;

  return data;
};
