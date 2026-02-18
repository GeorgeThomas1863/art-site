import dbModel from "../models/db-model.js";

export const storeCustomerData = async (orderData) => {
  if (!orderData) return null;
  const { customerData: customer, orderId, orderDate, amountPaid, itemCount } = orderData;
  const { firstName, lastName, email, phone, address, city, state, zip } = customer;

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
  if (updateData) return customerParams;

  const newCustomerModel = new dbModel(customerParams, process.env.CUSTOMERS_COLLECTION);
  const newCustomerData = await newCustomerModel.storeAny();
  if (!newCustomerData || !newCustomerData.insertedId) return null;

  // console.log("NEW CUSTOMER DATA");
  // console.log(newCustomerData);

  customerParams.customerId = newCustomerData.insertedId.toString();

  const backfillModel = new dbModel(
    { keyToLookup: "_id", itemValue: newCustomerData.insertedId, updateObj: { customerId: customerParams.customerId } },
    process.env.CUSTOMERS_COLLECTION
  );
  await backfillModel.updateObjItem();

  return customerParams;
};

export const updateCustomerData = async (inputParams) => {
  if (!inputParams) return null;
  const { firstName, lastName, email, lastOrderId, lastOrderDate, lastAmountPaid, totalPaid, totalItemsPurchased } = inputParams;

  const checkParams = {
    keyToLookup1: "firstName",
    keyToLookup2: "lastName",
    keyToLookup3: "email",
    itemValue1: firstName,
    itemValue2: lastName,
    itemValue3: email,
  };

  const checkModel = new dbModel(checkParams, process.env.CUSTOMERS_COLLECTION);
  const checkData = await checkModel.matchMultiItems();
  if (!checkData) return null;

  // console.log("CHECK DATA");
  // console.log(checkData);

  //otherwise update
  const updateParams = {
    lastOrderId: lastOrderId,
    lastOrderDate: lastOrderDate,
    lastAmountPaid: +lastAmountPaid,
    totalPaid: +(Number(checkData.totalPaid || 0) + Number(totalPaid)),
    totalItemsPurchased: +(Number(checkData.totalItemsPurchased || 0) + Number(totalItemsPurchased)),
    totalOrders: +(Number(checkData.totalOrders || 0) + 1),
  };

  const updateModel = new dbModel({ keyToLookup: "_id", itemValue: checkData._id, updateObj: updateParams }, process.env.CUSTOMERS_COLLECTION);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return null;
  return updateParams;
};
