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

    const confirmationData = await sendOrderConfirmationEmails(orderData);
    if (!confirmationData || !confirmationData.success) return { success: false, message: "Failed to send confirmation emails" };

    req.session.cart = [];
    req.session.shipping = null;

    const { orderId, orderNumber, orderDate, paymentStatus, itemCost, receiptURL } = orderData;
    return {
      success: true,
      message: "Order placed successfully",
      orderData: {
        orderId,
        orderNumber,
        orderDate,
        paymentStatus,
        itemCost,
        shippingCost: orderData.shippingCost,
        tax: orderData.tax,
        totalCost: orderData.totalCost,
        receiptURL,
      },
      customerData: orderData.customerData,
      cartData: orderData.items,
    };
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
  const { orderNumber, orderDate, itemCost, shippingCost, tax, totalCost, receiptURL, items, customerData } = orderData;
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

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation — #${orderNumber}</h2>
      <p>Thank you for your order, ${firstName} ${lastName}!</p>
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

      ${receiptURL ? `<p><a href="${receiptURL}">View Receipt on Square</a></p>` : ""}
    </div>
  `;

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await Promise.all([
      transport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Order Confirmation — #${orderNumber}`,
        html: emailHtml,
      }),
      transport.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECIPIENT,
        subject: `New Order — #${orderNumber} from ${firstName} ${lastName}`,
        html: emailHtml,
      }),
    ]);
    console.log("ORDER EMAILS SENT — order #" + orderNumber);
    return { success: true };
  } catch (error) {
    console.error("ORDER EMAIL ERROR:", error);
    return { success: false };
  }
};
