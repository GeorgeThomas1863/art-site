export const buildConfirmOrderForm = async () => {
  const confirmOrderContainer = document.createElement("div");
  confirmOrderContainer.className = "confirm-order-container";

  const confirmHeader = await buildConfirmHeader();
  const confirmContent = await buildConfirmContent();

  confirmOrderContainer.append(confirmHeader, confirmContent);

  return confirmOrderContainer;
};

export const buildConfirmHeader = async () => {
  const confirmHeader = document.createElement("div");
  confirmHeader.className = "confirm-header";

  const successIcon = document.createElement("div");
  successIcon.className = "confirm-success-icon";
  successIcon.textContent = "✓";

  const confirmTitle = document.createElement("h1");
  confirmTitle.className = "confirm-title";
  confirmTitle.textContent = "Order Confirmed";

  const confirmSubtitle = document.createElement("p");
  confirmSubtitle.className = "confirm-subtitle";
  confirmSubtitle.textContent = "Thank you for your purchase!";

  confirmHeader.append(successIcon, confirmTitle, confirmSubtitle);

  return confirmHeader;
};

export const buildConfirmContent = async () => {
  const confirmContent = document.createElement("div");
  confirmContent.className = "confirm-content";

  const confirmDetails = await buildConfirmDetails();
  const confirmItemsSection = await buildConfirmItemsSection();
  const confirmActions = await buildConfirmActions();

  confirmContent.append(confirmDetails, confirmItemsSection, confirmActions);

  return confirmContent;
};

export const buildConfirmDetails = async () => {
  const detailsSection = document.createElement("div");
  detailsSection.className = "confirm-details-section";

  const detailsCard = document.createElement("div");
  detailsCard.className = "confirm-card";

  const cardTitle = document.createElement("h2");
  cardTitle.className = "confirm-card-title";
  cardTitle.textContent = "Order Details";

  const detailsGrid = document.createElement("div");
  detailsGrid.className = "confirm-details-grid";

  // Order Number
  const orderNumberRow = await buildDetailRow("Order Number", "Loading...", "order-number");

  // Order Date
  const orderDateRow = await buildDetailRow("Order Date", "Loading...", "order-date");

  // Payment Status
  const paymentStatusRow = await buildDetailRow("Payment Status", "Loading...", "payment-status");

  // Email
  const emailRow = await buildDetailRow("Email", "Loading...", "customer-email");

  detailsGrid.append(orderNumberRow, orderDateRow, paymentStatusRow, emailRow);

  // Shipping Address Section
  const shippingTitle = document.createElement("h3");
  shippingTitle.className = "confirm-subsection-title";
  shippingTitle.textContent = "Shipping Address";

  const shippingAddress = document.createElement("div");
  shippingAddress.className = "confirm-address";
  shippingAddress.id = "shipping-address";
  shippingAddress.textContent = "Loading...";

  // Shipping Method Section
  const shippingMethodTitle = document.createElement("h3");
  shippingMethodTitle.className = "confirm-subsection-title";
  shippingMethodTitle.textContent = "Shipping Method";

  const shippingMethodRow = await buildDetailRow("Service", "Loading...", "shipping-method");
  const estimatedDeliveryRow = await buildDetailRow("Estimated Delivery", "Loading...", "estimated-delivery");

  detailsCard.append(cardTitle, detailsGrid, shippingTitle, shippingAddress, shippingMethodTitle, shippingMethodRow, estimatedDeliveryRow);
  detailsSection.append(detailsCard);

  return detailsSection;
};

export const buildConfirmItemsSection = async () => {
  const itemsSection = document.createElement("div");
  itemsSection.className = "confirm-items-section";

  const itemsCard = document.createElement("div");
  itemsCard.className = "confirm-card";

  const cardTitle = document.createElement("h2");
  cardTitle.className = "confirm-card-title";
  cardTitle.textContent = "Order Summary";

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "confirm-items-container";
  itemsContainer.id = "confirm-items-container";

  // Order totals
  const summaryDetails = document.createElement("div");
  summaryDetails.className = "confirm-summary-details";

  const subtotalRow = await buildSummaryRow("Subtotal:", "$0.00", "confirm-subtotal");
  const shippingRow = await buildSummaryRow("Shipping:", "$0.00", "confirm-shipping");
  const taxRow = await buildSummaryRow("Tax:", "$0.00", "confirm-tax");

  const totalRow = document.createElement("div");
  totalRow.className = "confirm-summary-row confirm-summary-total";

  const totalLabel = document.createElement("span");
  totalLabel.className = "confirm-summary-label";
  totalLabel.textContent = "Total:";

  const totalValue = document.createElement("span");
  totalValue.className = "confirm-summary-value";
  totalValue.id = "confirm-total";
  totalValue.textContent = "$0.00";

  totalRow.append(totalLabel, totalValue);
  summaryDetails.append(subtotalRow, shippingRow, taxRow, totalRow);

    // Receipt Link
    const receiptLink = document.createElement("a");
    receiptLink.className = "confirm-receipt-link";
    receiptLink.id = "receipt-link";
    receiptLink.href = "#";
    receiptLink.target = "_blank";
    receiptLink.textContent = "View Receipt on Square";
    receiptLink.style.display = "none"; // Hidden until URL is set

  itemsCard.append(cardTitle, itemsContainer, summaryDetails, receiptLink);
  itemsSection.append(itemsCard);

  return itemsSection;
};

export const buildConfirmActions = async () => {
  const actionsSection = document.createElement("div");
  actionsSection.className = "confirm-actions-section";

  const continueShoppingBtn = document.createElement("a");
  continueShoppingBtn.className = "confirm-action-btn";
  continueShoppingBtn.href = "/products";
  continueShoppingBtn.textContent = "Continue Shopping";

  const viewOrdersBtn = document.createElement("a");
  viewOrdersBtn.className = "confirm-action-btn confirm-action-btn-secondary";
  viewOrdersBtn.href = "/";
  viewOrdersBtn.textContent = "Return Home";

  actionsSection.append(continueShoppingBtn, viewOrdersBtn);

  return actionsSection;
};

export const buildDetailRow = async (label, value, valueId) => {
  const row = document.createElement("div");
  row.className = "confirm-detail-row";

  const labelSpan = document.createElement("span");
  labelSpan.className = "confirm-detail-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "confirm-detail-value";
  valueSpan.id = valueId;
  valueSpan.textContent = value;

  row.append(labelSpan, valueSpan);

  return row;
};

export const buildSummaryRow = async (label, value, valueId) => {
  const row = document.createElement("div");
  row.className = "confirm-summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.className = "confirm-summary-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "confirm-summary-value";
  valueSpan.id = valueId;
  valueSpan.textContent = value;

  row.append(labelSpan, valueSpan);

  return row;
};

//--------------------

export const buildConfirmItem = async (itemData) => {
  const confirmItem = document.createElement("div");
  confirmItem.className = "confirm-item";

  const itemImage = document.createElement("img");
  itemImage.className = "confirm-item-image";
  itemImage.src = itemData.image;
  itemImage.alt = itemData.name;

  const itemDetails = document.createElement("div");
  itemDetails.className = "confirm-item-details";

  const itemName = document.createElement("div");
  itemName.className = "confirm-item-name";
  itemName.textContent = itemData.name;

  const itemQuantity = document.createElement("div");
  itemQuantity.className = "confirm-item-quantity";
  itemQuantity.textContent = `Qty: ${itemData.quantity}`;

  const itemPrice = document.createElement("div");
  itemPrice.className = "confirm-item-price";
  const totalPrice = itemData.price * itemData.quantity;
  itemPrice.textContent = `$${totalPrice.toFixed(2)}`;

  itemDetails.append(itemName, itemQuantity);
  confirmItem.append(itemImage, itemDetails, itemPrice);

  return confirmItem;
};
