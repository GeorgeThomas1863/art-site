import CONFIG from "../config/config.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import dbModel from "../models/db-model.js";

export const runPlaceOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  const cart = await runGetCartStats(req);
  if (!cart || !cart.success || !cart.total) return { success: false, message: "Failed to get cart data" };

  // console.log("RUN PLACE ORDER");
  // console.log("INPUT PARAMS");
  // console.log(inputParams);
  // console.log("CART");
  // console.log(cart);

  //TEST THIS
  const data = await processPayment(cart.total, inputParams);
  // console.log("PROCESS PAYMENT DATA");
  // console.log(data);
  if (!data || !data.success) return { success: false, message: "Failed to process payment" };

  const orderData = await storeOrderData(data.payment, cart, inputParams);
  console.log("STORE ORDER DATA");
  console.log(orderData);

  const customerData = await storeCustomerData(inputParams, orderData);
};

export const storeOrderData = async (payment, cart, inputParams) => {
  if (!payment || !cart || !inputParams) return null;

  const { ordersCollection } = CONFIG;
  const { route, paymentToken, ...customerObj } = inputParams;
  const { total, itemCount } = cart;
  const { id: paymentId, orderId: squareOrderId, status, createdAt, totalMoney, approvedMoney, billingAddress, riskEvaluation, delayAction, delayedUntil, receiptNumber, receiptUrl } = payment; //prettier-ignore

  // console.log("ORDERS COLLECTION");
  // console.log(ordersCollection);

  console.log("CART");
  console.log(cart);

  const startParams = {
    itemCost: Number(total).toFixed(2),
    tax: (Number(total) * 0.08).toFixed(2),
    itemCount: itemCount,
    customerData: customerObj,
  };

  //start order to get internal id
  const orderStartModel = new dbModel(startParams, ordersCollection);
  const orderStartData = await orderStartModel.storeAny();
  if (!orderStartData) return { success: false, message: "Failed to store order start" };
  // console.log("ORDER START DATA");
  // console.log(orderStartData);

  //set order id to mongo id
  const orderId = orderStartData.insertedId?.toString() || null;
  console.log("ORDER ID");
  console.log(orderId);

  if (!orderId) return { success: false, message: "Failed to get order start id" };

  //build rest of order data
  const updateParams = {
    //----------
    orderId: orderId,
    paymentId: paymentId,
    squareOrderId: squareOrderId,
    paymentStatus: status,
    orderDate: createdAt,
    totalCost: (Number(totalMoney.amount) / 100).toFixed(2), //convert to dollars
    amountPaid: (Number(approvedMoney.amount) / 100).toFixed(2), //convert to dollars
    currency: approvedMoney.currency,
    billingAddress: billingAddress,
    risk: riskEvaluation.riskLevel,
    delayAction: delayAction,
    delayedUntil: delayedUntil,
    receiptNumber: receiptNumber,
    receiptURL: receiptUrl,
  };

  console.log("UPDATE PARAMS");
  console.log(updateParams);

  const updateModel = new dbModel({ keyToLookup: "_id", itemValue: orderStartData.insertedId, updateObj: updateParams }, ordersCollection);
  const updateData = await updateModel.updateObjItem();
  console.log("UPDATE DATA");
  console.log(updateData);

  return updateParams;
};

export const storeCustomerData = async (inputParams, orderData) => {
  if (!inputParams || !orderData) return null;

  //check if customer already exists

  //if not get new customer id

  //build rest of customer data adn store
};
