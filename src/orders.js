import dbModel from "../models/db-model.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import { storeCustomerData } from "./customer.js";

export const placeNewOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  const cartStats = await runGetCartStats(req);
  if (!cartStats || !cartStats.total) return { success: false, message: "Failed to get cart data" };

  //TEST THIS
  const data = await processPayment(cartStats.total, inputParams);
  if (!data || !data.success || !data.payment) return { success: false, message: "Failed to process payment" };

  data.cartData = req.session.cart;
  data.cartStats = cartStats;

  console.log("DATA");
  console.log(data);

  //HERE!!!!!, get shipping data?, finish confirm email

  const orderData = await storeOrderData(data, inputParams);
  // console.log("STORE ORDER DATA");
  // console.log(orderData);

  const customerData = await storeCustomerData(orderData, cartStats, inputParams);
  if (!customerData) return { success: false, message: "Failed to store customer data" };

  const returnParams = {
    success: true,
    message: "Order placed successfully",
    paymentData: data.payment,
    orderData: orderData,
    customerData: customerData,
    cartData: cartData,
  };

  console.log("RETURN PARAMS");
  console.log(returnParams);

  return returnParams;
};

export const storeOrderData = async (paymentData, inputParams) => {
  if (!paymentData || !inputParams) return null;

  const { route, paymentToken, ...customerObj } = inputParams;
  const { cartData, cartStats, payment } = paymentData;
  const { total, itemCount } = cartStats;
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
