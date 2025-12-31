import CONFIG from "../config/config.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import dbModel from "../models/db-model.js";

export const runPlaceOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  const cart = await runGetCartStats(req);
  if (!cart || !cart.success || !cart.total) return { success: false, message: "Failed to get cart data" };

  console.log("RUN PLACE ORDER");
  console.log("INPUT PARAMS");
  console.log(inputParams);
  console.log("CART");
  console.log(cart);

  //TEST THIS
  const data = await processPayment(cart.total, inputParams);
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
  const { total, items } = cart;
  const { id: paymentId, orderId: squareOrderId, status, createdAt, totalMoney, approvedMoney, billingAddress, riskEvaluation, delayedAction, delayedUntil, receiptNumber, receiptUrl } = payment; //prettier-ignore

  //start order to get internal id
  const orderStartModel = new dbModel("orderStart", ordersCollection);
  const orderStartData = await orderStartModel.storeAny();
  if (!orderStartData) return { success: false, message: "Failed to store order start" };

  const orderId = orderStartData.insertedId?.toString() || null;
  if (!orderId) return { success: false, message: "Failed to get order start id" };

  //build rest of order data
  const updateParams = {
    itemCost: total,
    tax: total * 0.08,
    orderItems: items,
    //----------
    paymentId: paymentId,
    squareOrderId: squareOrderId,
    paymentStatus: status,
    orderDate: createdAt,
    totalCost: totalMoney.amount / 100, //convert to dollars
    amountPaid: approvedMoney.amount / 100, //convert to dollars
    currency: approvedMoney.currency,
    billingAddress: billingAddress,
    risk: riskEvaluation.riskLevel,
    delayedAction: delayedAction,
    delayedUntil: delayedUntil,
    receiptNumber: receiptNumber,
    receiptURL: receiptUrl,
    //--------
    customerData: customerObj,
  };

  const updateModel = new dbModel({ keyToLookup: "_id", itemValue: orderId, updateObj: updateParams }, ordersCollection);
  const updateData = await updateModel.updateObjItem();
  console.log("UPDATE DATA");
  console.log(updateData);

  updateParams.orderId = orderId;

  return updateParams;
};

export const storeCustomerData = async (inputParams, orderData) => {
  if (!inputParams || !orderData) return null;

  //check if customer already exists

  //if not get new customer id

  //build rest of customer data adn store
};
