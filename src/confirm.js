import nodemailer from "nodemailer";

export const sendConfirmationEmails = async (orderData, cart) => {
  if (!orderData) return { success: false, message: "No order data provided" };
  const { customerData, cartData, shippingData } = orderData;

  const transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const customerHTML = await buildCustomerEmailHTML(orderData, cart);

  const customerParams = {
    from: process.env.EMAIL_USER,
    to: customerData.email,
    subject: `Order Confirmation - Order #${orderData.orderNumber}`,
    html: buildCustomerEmailHTML(orderData, customerData, cartData, shippingData),
  };
};

const sendOrderEmails = async (returnParams, shippingData) => {
  try {
    const { orderData, customerData, cartData } = returnParams;
    if (!orderData || !customerData) return;

    const results = await Promise.allSettled([
      sendCustomerEmail(transport, customerData, orderData, cartData, shippingData),
      sendAdminEmail(transport, orderData, customerData, cartData, shippingData),
    ]);

    results.forEach((result, i) => {
      const label = i === 0 ? "CUSTOMER" : "ADMIN";
      if (result.status === "fulfilled") {
        console.log(`${label} ORDER EMAIL SENT:`, result.value?.messageId || "OK");
      } else {
        console.error(`${label} ORDER EMAIL FAILED:`, result.reason);
      }
    });
  } catch (error) {
    console.error("ORDER EMAIL ERROR:", error);
  }
};

const sendCustomerEmail = async (transport, customerData, orderData, cartData, shippingData) => {
  const { email, firstName } = customerData;
  if (!email) return null;

  return transport.sendMail(mailParams);
};

const sendAdminEmail = async (transport, orderData, customerData, cartData, shippingData) => {
  const name = `${customerData.firstName} ${customerData.lastName}`;
  const total = Number(orderData.totalCost).toFixed(2);

  const mailParams = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECIPIENT,
    subject: `New Order #${orderData.orderNumber} - ${name} - $${total}`,
    html: buildAdminEmailHTML(orderData, customerData, cartData, shippingData),
  };

  return transport.sendMail(mailParams);
};

const buildItemsTableHTML = (cartData) => {
  if (!cartData || !cartData.length) return "<p>No items available</p>";

  let rows = "";
  cartData.forEach((item) => {
    const lineTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
    rows += `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: left;">${item.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.price).toFixed(2)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${lineTotal}</td>
        </tr>`;
  });

  return `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 8px 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 8px 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
};

const buildCustomerEmailHTML = (orderData, customerData, cartData, shippingData) => {
  const shippingCost = shippingData?.selectedRate?.shipping_amount?.amount;
  const shippingService = shippingData?.selectedRate?.service_name;
  const deliveryDays = shippingData?.selectedRate?.delivery_days;
  const estimatedDelivery = shippingData?.selectedRate?.estimated_delivery_date;

  const shippingDisplay = shippingCost != null ? `$${Number(shippingCost).toFixed(2)}` : "TBD";
  const shippingMethodDisplay = shippingService || "TBD";
  const deliveryDisplay = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : deliveryDays
    ? `${deliveryDays} business days`
    : "TBD";

  return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #222; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Order Confirmation</h1>
        </div>
  
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Hi ${customerData.firstName},</p>
          <p>Thank you for your order! Here's a summary of your purchase.</p>
  
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> #${orderData.orderNumber}</p>
            <p style="margin: 4px 0;"><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${orderData.paymentStatus}</p>
          </div>
  
          <h2 style="font-size: 18px; border-bottom: 2px solid #222; padding-bottom: 8px;">Items Ordered</h2>
          ${buildItemsTableHTML(cartData)}
  
          <div style="text-align: right; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${Number(orderData.itemCost).toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Shipping:</strong> ${shippingDisplay}</p>
            <p style="margin: 4px 0;"><strong>Tax:</strong> $${Number(orderData.tax).toFixed(2)}</p>
            <p style="margin: 4px 0; font-size: 18px;"><strong>Total:</strong> $${Number(orderData.totalCost).toFixed(2)}</p>
          </div>
  
          <h2 style="font-size: 18px; border-bottom: 2px solid #222; padding-bottom: 8px;">Shipping Details</h2>
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px;">
            <p style="margin: 4px 0;"><strong>Method:</strong> ${shippingMethodDisplay}</p>
            <p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${deliveryDisplay}</p>
            <p style="margin: 4px 0;"><strong>Ship To:</strong></p>
            <p style="margin: 4px 0 4px 12px;">
              ${customerData.firstName} ${customerData.lastName}<br>
              ${customerData.address}<br>
              ${customerData.city}, ${customerData.state} ${customerData.zip}
            </p>
          </div>
  
          ${
            orderData.receiptURL
              ? `<p style="margin-top: 20px;"><a href="${orderData.receiptURL}" style="color: #222; font-weight: bold;">View Payment Receipt</a></p>`
              : ""
          }
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
          <p style="font-size: 13px; color: #888;">If you have any questions about your order, please reply to this email or use our contact form.</p>
        </div>
      </div>`;
};

const buildAdminEmailHTML = (orderData, customerData, cartData, shippingData) => {
  const shippingCost = shippingData?.selectedRate?.shipping_amount?.amount;
  const shippingService = shippingData?.selectedRate?.service_name;

  const shippingDisplay = shippingCost != null ? `$${Number(shippingCost).toFixed(2)}` : "TBD";
  const shippingMethodDisplay = shippingService || "TBD";

  return `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #1a5c2a; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">New Order Received</h1>
        </div>
  
        <div style="padding: 24px;">
          <div style="background-color: #f0faf3; padding: 16px; border-radius: 6px; border-left: 4px solid #1a5c2a; margin-bottom: 20px;">
            <p style="margin: 4px 0; font-size: 18px;"><strong>Order #${orderData.orderNumber}</strong></p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> $${Number(orderData.totalCost).toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${orderData.paymentStatus}</p>
            <p style="margin: 4px 0;"><strong>Items:</strong> ${orderData.itemCount}</p>
          </div>
  
          <h2 style="font-size: 18px; border-bottom: 2px solid #1a5c2a; padding-bottom: 8px;">Customer Information</h2>
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 4px 0;"><strong>Name:</strong> ${customerData.firstName} ${customerData.lastName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${customerData.email}</p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> ${customerData.phone || "N/A"}</p>
            <p style="margin: 4px 0;"><strong>Address:</strong> ${customerData.address}, ${customerData.city}, ${customerData.state} ${
    customerData.zip
  }</p>
          </div>
  
          <h2 style="font-size: 18px; border-bottom: 2px solid #1a5c2a; padding-bottom: 8px;">Order Items</h2>
          ${buildItemsTableHTML(cartData)}
  
          <div style="text-align: right; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Subtotal:</strong> $${Number(orderData.itemCost).toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Shipping (${shippingMethodDisplay}):</strong> ${shippingDisplay}</p>
            <p style="margin: 4px 0;"><strong>Tax:</strong> $${Number(orderData.tax).toFixed(2)}</p>
            <p style="margin: 4px 0; font-size: 18px;"><strong>Total Charged:</strong> $${Number(orderData.totalCost).toFixed(2)}</p>
          </div>
  
          <h2 style="font-size: 18px; border-bottom: 2px solid #1a5c2a; padding-bottom: 8px;">Payment & Shipping</h2>
          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 6px;">
            <p style="margin: 4px 0;"><strong>Payment ID:</strong> ${orderData.paymentId}</p>
            <p style="margin: 4px 0;"><strong>Square Order ID:</strong> ${orderData.squareOrderId}</p>
            <p style="margin: 4px 0;"><strong>Shipping Method:</strong> ${shippingMethodDisplay}</p>
            ${
              orderData.receiptURL
                ? `<p style="margin: 4px 0;"><a href="${orderData.receiptURL}" style="color: #1a5c2a; font-weight: bold;">View Receipt</a></p>`
                : ""
            }
          </div>
        </div>
      </div>`;
};
