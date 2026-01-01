import CONFIG from "../config/config.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import dbModel from "../models/db-model.js";

export const placeNewOrder = async (req) => {
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
  // console.log("STORE ORDER DATA");
  // console.log(orderData);

  const customerData = await storeCustomerData(orderData, cart, inputParams);
  // console.log("CUSTOMER DATA");
  // console.log(customerData);
  if (!customerData) return { success: false, message: "Failed to store customer data" };

  const returnParams = {
    success: true,
    message: "Order placed successfully",
    paymentData: data.payment,
    orderData: orderData,
    customerData: customerData,
  };

  // console.log("RETURN PARAMS");
  // console.log(returnParams);

  return returnParams;
};

export const storeOrderData = async (payment, cart, inputParams) => {
  if (!payment || !cart || !inputParams) return null;

  const { ordersCollection } = CONFIG;
  const { route, paymentToken, ...customerObj } = inputParams;
  const { total, itemCount } = cart;
  const { id: paymentId, orderId: squareOrderId, status, createdAt, totalMoney, approvedMoney, billingAddress, riskEvaluation, delayAction, delayedUntil, receiptNumber, receiptUrl } = payment; //prettier-ignore

  const startParams = {
    itemCost: +Number(total).toFixed(2),
    tax: +(Number(total) * 0.08).toFixed(2),
    itemCount: +itemCount,
    customerData: customerObj,
  };

  //start order to get internal id
  const orderStartModel = new dbModel(startParams, ordersCollection);
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

  console.log("UPDATE PARAMS");
  console.log(updateParams);

  const updateModel = new dbModel({ keyToLookup: "_id", itemValue: orderStartData.insertedId, updateObj: updateParams }, ordersCollection);
  const updateData = await updateModel.updateObjItem();
  console.log("UPDATE DATA");
  console.log(updateData);

  return updateParams;
};

export const storeCustomerData = async (orderData, cart, inputParams) => {
  if (!inputParams || !orderData || !cart) return null;
  const { firstName, lastName, email, phone, address, city, state, zip } = inputParams;
  const { orderId, orderDate, amountPaid } = orderData;
  const { itemCount } = cart;
  const { customersCollection } = CONFIG;

  const customerParams = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
    address: address,
    city: city,
    state: state,
    zip: zip,
    lastOrderId: orderId,
    lastOrderDate: orderDate,
    lastAmountPaid: +amountPaid,
    totalPaid: +amountPaid,
    totalItemsPurchased: +itemCount,
    totalOrders: 1,
  };

  //check if customer already exists, returns null if not
  const updateData = await updateCustomerData(customerParams);
  if (updateData) return updateData;

  //otherwise create new customer
  const newCustomerModel = new dbModel({ firstOrderDate: orderDate }, customersCollection);
  const newCustomerData = await newCustomerModel.storeAny();

  console.log("NEW CUSTOMER DATA");
  console.log(newCustomerData);
  if (!newCustomerData) return null;
  const customerId = newCustomerData.insertedId?.toString() || null;
  if (!customerId) return null;

  console.log("CUSTOMER ID");
  console.log(customerId);

  customerParams.customerId = customerId;

  const storeModel = new dbModel({ keyToLookup: "_id", itemValue: newCustomerData.insertedId, updateObj: customerParams }, customersCollection); //prettier-ignore
  const storeData = await storeModel.updateObjItem();
  if (!storeData) return null;
  return customerParams;
};

export const updateCustomerData = async (inputParams) => {
  if (!inputParams) return null;
  const { firstName, lastName, address, lastOrderId, lastOrderDate, lastAmountPaid, totalPaid, totalItemsPurchased } = inputParams;
  const { customersCollection } = CONFIG;

  const checkParams = {
    keyToLookup1: "firstName",
    keyToLookup2: "lastName",
    keyToLookup3: "address",
    itemValue1: firstName,
    itemValue2: lastName,
    itemValue3: address,
  };

  const checkModel = new dbModel(checkParams, customersCollection);
  const checkData = await checkModel.matchMultiItems();

  console.log("CHECK DATA");
  console.log(checkData);
  if (!checkData) return null;

  //otherwise update
  const updateParams = {
    lastOrderId: lastOrderId,
    lastOrderDate: lastOrderDate,
    lastAmountPaid: +lastAmountPaid,
    totalPaid: +(Number(checkData.totalPaid || 0) + Number(totalPaid)),
    totalItemsPurchased: +(Number(checkData.totalItemsPurchased || 0) + Number(totalItemsPurchased)),
    totalOrders: +(Number(checkData.totalOrders || 0) + 1),
  };

  const updateModel = new dbModel({ keyToLookup: "customerId", itemValue: checkData.customerId, updateObj: updateParams }, customersCollection);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return null;
  return updateParams;
};
