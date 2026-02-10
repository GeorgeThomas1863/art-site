import nodemailer from "nodemailer";
import dbModel from "../models/db-model.js";
import { runGetCartStats } from "./cart.js";
import { processPayment } from "./payments.js";
import { storeCustomerData } from "./customer.js";

export const placeNewOrder = async (req) => {
  if (!req || !req.body) return { success: false, message: "No input parameters" };
  const inputParams = req.body;

  if (!req.session.cart || !req.session.cart.length) {
    return { success: false, message: "Cart is empty" };
  }

  if (!req.session.shipping || !req.session.shipping.selectedRate) {
    return { success: false, message: "No shipping rate selected" };
  }

  const shippingCost = +Number(req.session.shipping.selectedRate.shipping_amount.amount).toFixed(2);
  if (!shippingCost) return { success: false, message: "Failed to get shipping cost" };

  const cartStats = await runGetCartStats(req);
  if (!cartStats || !cartStats.total) return { success: false, message: "Failed to get cart data" };

  const subtotal = +Number(cartStats.total).toFixed(2);
  const taxRate = process.env.TAX_RATE;
  const tax = +(subtotal * taxRate).toFixed(2);
  const totalCost = +(subtotal + shippingCost + tax).toFixed(2);
  const totalInCents = Math.round(totalCost * 100);

  try {
    const paymentData = await processPayment(totalInCents, inputParams);
    if (!paymentData || !paymentData.success || !paymentData.payment) {
      return { success: false, message: "Failed to process payment" };
    }

    const payment = paymentData.payment;
    const { route, paymentToken, ...customerObj } = inputParams;

    const orderObj = {
      customerData: customerObj,
      items: req.session.cart,
      itemCount: cartStats.itemCount,
      itemCost: subtotal,
      shippingCost,
      tax,
      totalCost,
      paymentId: payment.id,
      squareOrderId: payment.orderId,
      paymentStatus: payment.status,
      orderDate: payment.createdAt,
      amountPaid: +(Number(payment.approvedMoney.amount) / 100).toFixed(2),
      currency: payment.approvedMoney.currency,
      billingAddress: payment.billingAddress,
      risk: payment.riskEvaluation?.riskLevel || null,
      receiptNumber: payment.receiptNumber,
      receiptURL: payment.receiptUrl,
    };

    const orderData = await storeOrderData(orderObj);
    if (!orderData || !orderData.orderId) return { success: false, message: "Failed to store order data" };

    const customerData = await storeCustomerData(orderData);
    if (!customerData) return { success: false, message: "Failed to store customer data" };

    const emailResult = await sendOrderConfirmationEmails(orderData);
    if (!emailResult.buyerSent || !emailResult.adminSent) {
      console.error("EMAIL ISSUE — buyer:", emailResult.buyerSent, "admin:", emailResult.adminSent);
    }

    req.session.cart = [];
    req.session.shipping = null;

    const returnObj = {
      success: true,
      message: "Order placed successfully",
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        orderDate: orderData.orderDate,
        paymentStatus: orderData.paymentStatus,
        itemCost: orderData.itemCost,
        shippingCost: orderData.shippingCost,
        tax: orderData.tax,
        totalCost: orderData.totalCost,
        receiptURL: orderData.receiptURL,
        customerData: orderData.customerData,
        cartData: orderData.items,
      },
    };

    return returnObj;
  } catch (e) {
    console.error("ORDER ERROR:", e);
    return { success: false, message: "Failed to place order" };
  }
};

//----------

export const storeOrderData = async (orderObj) => {
  if (!orderObj) return null;

  const orderNumber = await getOrderNumber();
  if (!orderNumber) return null;
  console.log("ORDER NUMBER:", orderNumber);

  orderObj.orderNumber = orderNumber;

  const orderModel = new dbModel(orderObj, process.env.ORDERS_COLLECTION);
  const result = await orderModel.storeAny();
  if (!result || !result.insertedId) return null;

  orderObj.orderId = result.insertedId.toString();
  console.log("ORDER STORED — ID:", orderObj.orderId);

  return orderObj;
};

//----------

export const getOrderNumber = async () => {
  const dataModel = new dbModel({ keyToLookup: "orderNumber" }, process.env.ORDERS_COLLECTION);
  const orderNumber = await dataModel.getMaxId();

  if (!orderNumber) return 1;
  return orderNumber + 1;
};

//----------

export const sendOrderConfirmationEmails = async (orderData) => {
  const { email, firstName, lastName } = orderData.customerData;
  const { orderNumber } = orderData;

  let buyerSent = false;
  let adminSent = false;

  const buyerHtml = buildEmailHtml(orderData, "buyer");
  const adminHtml = buildEmailHtml(orderData, "admin");

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Order Confirmation — #${orderNumber}`,
      html: buyerHtml,
    });
    buyerSent = true;
    console.log("BUYER EMAIL SENT — order #" + orderNumber);
  } catch (error) {
    console.error("BUYER EMAIL ERROR:", error);
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: `New Order — #${orderNumber} from ${firstName} ${lastName}`,
      html: adminHtml,
    });
    adminSent = true;
    console.log("ADMIN EMAIL SENT — order #" + orderNumber);
  } catch (error) {
    console.error("ADMIN EMAIL ERROR:", error);
  }

  return { buyerSent, adminSent };
};

//----------

const buildEmailHtml = (orderData, type) => {
  const {
    orderNumber,
    orderDate,
    itemCost,
    shippingCost,
    tax,
    totalCost,
    receiptURL,
    items,
    customerData,
    paymentId,
    squareOrderId,
    risk,
    billingAddress,
    receiptNumber,
    amountPaid,
    currency,
  } = orderData;
  const { firstName, lastName, email, address, city, state, zip } = customerData;

  const formattedDate = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let itemRows = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const lineTotal = (item.price * item.quantity).toFixed(2);
    itemRows += `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${lineTotal}</td>
    </tr>`;
  }

  const isAdmin = type === "admin";
  const header = isAdmin
    ? `<h2>New Order — #${orderNumber}</h2>
      <p><strong>Customer:</strong> ${firstName} ${lastName} (${email})</p>`
    : `<h2>Order Confirmation — #${orderNumber}</h2>
      <p>Thank you for your order, ${firstName} ${lastName}!</p>`;

  let paymentSection = "";
  if (isAdmin) {
    const billingLine = billingAddress
      ? `${billingAddress.addressLine1 || ""}${billingAddress.addressLine2 ? ", " + billingAddress.addressLine2 : ""}, ${
          billingAddress.locality || ""
        }, ${billingAddress.administrativeDistrictLevel1 || ""} ${billingAddress.postalCode || ""}, ${billingAddress.country || ""}`
      : "N/A";

    paymentSection = `
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #ccc;">

      <h3>Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 8px;"><strong>Payment ID:</strong></td><td style="padding: 4px 8px;">${paymentId}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Square Order ID:</strong></td><td style="padding: 4px 8px;">${squareOrderId}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Risk Level:</strong></td><td style="padding: 4px 8px;">${risk || "N/A"}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Billing Address:</strong></td><td style="padding: 4px 8px;">${billingLine}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Receipt Number:</strong></td><td style="padding: 4px 8px;">${receiptNumber}</td></tr>
        <tr><td style="padding: 4px 8px;"><strong>Amount Paid:</strong></td><td style="padding: 4px 8px;">$${amountPaid} ${currency}</td></tr>
      </table>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${header}
      <p><strong>Date:</strong> ${formattedDate}</p>

      <h3>Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top: 16px; text-align: right;">
        <p><strong>Subtotal:</strong> $${itemCost.toFixed(2)}</p>
        <p><strong>Shipping:</strong> $${shippingCost.toFixed(2)}</p>
        <p><strong>Tax:</strong> $${tax.toFixed(2)}</p>
        <p style="font-size: 18px;"><strong>Total:</strong> $${totalCost.toFixed(2)}</p>
      </div>

      <h3>Shipping Address</h3>
      <p>${firstName} ${lastName}<br>${address}<br>${city}, ${state} ${zip}</p>

      ${paymentSection}

      ${receiptURL ? `<p><a href="${receiptURL}">View Receipt on Square</a></p>` : ""}
    </div>
  `;
};
