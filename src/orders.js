import dbModel from "../models/db-model.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import { storeCustomerData } from "./customer.js";
import { sendConfirmationEmails } from "./confirm.js";
import { getShippingFromSession, applyShippingAdjustments } from "./shipping.js";

export const placeNewOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  const cart = await runGetCartStats(req);
  if (!cart || !cart.success || !cart.total) return { success: false, message: "Failed to get cart data" };
  console.log("CART DATA");
  console.log(cart);

  const data = await processPayment(cart.total, inputParams);
  // console.log("PROCESS PAYMENT DATA");
  // console.log(data);
  if (!data || !data.success) return { success: false, message: "Failed to process payment" };
  console.log("PROCESS PAYMENT DATA");
  console.log(data);

  const shippingDataRaw = await getShippingFromSession(req);
  if (!shippingData || !shippingData.shipping || !shippingData.shipping.selectedRate) {
    return { success: false, message: "Failed to get shipping data" };
  }

  const shippingData = await applyShippingAdjustments(shippingDataRaw.shipping.selectedRate);

  //HERE
  console.log("SELECTED RATE");
  console.log(shippingData);

  const orderData = await storeOrderData(data.payment, cart, inputParams, selectedRate);
  console.log("STORE ORDER DATA");
  console.log(orderData);

  const customerData = await storeCustomerData(orderData, cart, inputParams);
  console.log("STORE CUSTOMER DATA");
  console.log(customerData);
  if (!customerData) return { success: false, message: "Failed to store customer data" };

  // const confirmationData = await sendConfirmationEmails(orderData, cart);

  // const returnParams = {
  //   success: true,
  //   message: "Order placed successfully",
  //   paymentData: data.payment,
  //   orderData: orderData,
  //   customerData: customerData,
  //   cartData: req.session.cart,
  // };

  // console.log("RETURN PARAMS");
  // console.log(returnParams);

  // const shippingData = req.session.shipping || null;
  // sendOrderEmails(returnParams, shippingData); // fire and forget

  // return returnParams;
};

export const storeOrderData = async (payment, cart, inputParams, shippingData) => {
  if (!payment || !cart || !inputParams || !shippingData) return null;

  const { route, paymentToken, ...customerObj } = inputParams;
  const { total, itemCount } = cart;
  const { id: paymentId, orderId: squareOrderId, status, createdAt, totalMoney, approvedMoney, billingAddress, riskEvaluation, delayAction, delayedUntil, receiptNumber, receiptUrl } = payment; //prettier-ignore

  const orderNumber = await getOrderNumber();
  console.log("ORDER NUMBER");
  console.log(orderNumber);

  const startParams = {
    itemCost: +Number(total).toFixed(2),
    tax: +(Number(total) * 0.08).toFixed(2),
    itemCount: +itemCount,
    customerData: customerObj,
    orderNumber: orderNumber,
  };

  //start order to get internal id
  const orderStartModel = new dbModel(startParams, process.env.ORDERS_COLLECTION);
  const orderStartData = await orderStartModel.storeAny();
  if (!orderStartData) return { success: false, message: "Failed to store order start" };

  //set order id to mongo id
  const orderId = orderStartData.insertedId?.toString() || null;
  if (!orderId) return { success: false, message: "Failed to get order start id" };
  console.log("ORDER ID");
  console.log(orderId);

  //build rest of order data
  const updateParams = {
    orderId: orderId,
    paymentId: paymentId,
    squareOrderId: squareOrderId,
    paymentStatus: status,
    orderDate: createdAt,
    totalCost: +(Number(totalMoney.amount) / 100).toFixed(2), //convert to dollars
    amountPaid: +(Number(approvedMoney.amount) / 100).toFixed(2), //convert to dollars
    currency: approvedMoney.currency,
    billingAddress: billingAddress,
    risk: riskEvaluation.riskLevel,
    delayAction: delayAction,
    delayedUntil: delayedUntil,
    receiptNumber: receiptNumber,
    receiptURL: receiptUrl,
    shippingData: shippingData,
  };

  // console.log("UPDATE PARAMS");
  // console.log(updateParams);

  const updateModel = new dbModel(
    { keyToLookup: "_id", itemValue: orderStartData.insertedId, updateObj: updateParams },
    process.env.ORDERS_COLLECTION
  );
  const updateData = await updateModel.updateObjItem();
  console.log("UPDATE DATA");
  console.log(updateData);

  const returnObj = { ...startParams, ...updateParams };

  return returnObj;
};

//----------

export const getOrderNumber = async () => {
  const dataModel = new dbModel({ keyToLookup: "orderNumber" }, process.env.ORDERS_COLLECTION);
  const orderNumber = await dataModel.getMaxId();

  console.log("ORDER NUMBER");
  console.log(orderNumber);

  if (!orderNumber) return 1;

  return orderNumber + 1;
};

//---------- ORDER CONFIRMATION EMAILS ----------
