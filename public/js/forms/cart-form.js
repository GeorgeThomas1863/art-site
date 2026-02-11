// forms/cart-form.js
export const buildCartForm = async () => {
  const cartContainer = document.createElement("div");
  cartContainer.className = "cart-container";

  const pageHeader = await buildCartPageHeader();
  const cartContent = await buildCartContent();

  cartContainer.append(pageHeader, cartContent);
  cartContainer.append(cartContent);

  return cartContainer;
};

export const buildCartPageHeader = async () => {
  const pageHeader = document.createElement("div");
  pageHeader.className = "cart-page-header";

  const pageTitle = document.createElement("h1");
  pageTitle.className = "cart-page-title";
  pageTitle.textContent = "Shopping Cart";

  pageHeader.append(pageTitle);

  return pageHeader;
};

export const buildCartContent = async () => {
  const cartContent = document.createElement("div");
  cartContent.className = "cart-content";

  // Create a wrapper for the right column
  const rightColumnWrapper = document.createElement("div");
  rightColumnWrapper.className = "cart-right-column";

  const cartItemsSection = await buildCartItemsSection();
  const cartSummarySection = await buildCartSummarySection();
  const shippingSection = await buildShippingSection();

  rightColumnWrapper.append(cartSummarySection, shippingSection);

  cartContent.append(cartItemsSection, rightColumnWrapper);

  return cartContent;
};

export const buildCartItemsSection = async () => {
  const itemsSection = document.createElement("div");
  itemsSection.className = "cart-items-section";

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "cart-items-container";
  itemsContainer.id = "cart-items-container";

  itemsSection.append(itemsContainer);

  return itemsSection;
};

export const buildCartSummarySection = async () => {
  const summarySection = document.createElement("div");
  summarySection.className = "cart-summary-section";

  const summaryCard = document.createElement("div");
  summaryCard.className = "cart-summary-card";

  const summaryTitle = document.createElement("h2");
  summaryTitle.className = "cart-summary-title";
  summaryTitle.textContent = "Order Summary";

  const summaryDetails = document.createElement("div");
  summaryDetails.className = "cart-summary-details";

  const itemCountRow = await buildSummaryRow("Items:", "0", "cart-summary-item-count");
  const subtotalRow = await buildSummaryRow("Subtotal:", "$0.00", "cart-summary-subtotal");
  const shippingRow = await buildSummaryRow("Shipping:", "[Calculated at checkout]", "cart-summary-shipping");

  const totalRow = document.createElement("div");
  totalRow.className = "cart-summary-row cart-summary-total";

  const totalLabel = document.createElement("span");
  totalLabel.className = "cart-summary-label";
  totalLabel.textContent = "Total:";

  const totalValue = document.createElement("span");
  totalValue.className = "cart-summary-value";
  totalValue.id = "cart-summary-total";
  totalValue.textContent = "$0.00";

  totalRow.append(totalLabel, totalValue);

  summaryDetails.append(itemCountRow, subtotalRow, shippingRow, totalRow);

  const checkoutBtn = document.createElement("button");
  checkoutBtn.className = "cart-checkout-btn";
  checkoutBtn.id = "cart-checkout-btn";
  checkoutBtn.textContent = "Proceed to Checkout";
  checkoutBtn.setAttribute("data-label", "checkout-btn");
  checkoutBtn.disabled = true;

  const continueShoppingLink = document.createElement("a");
  continueShoppingLink.className = "cart-continue-shopping";
  continueShoppingLink.href = "/products";
  continueShoppingLink.textContent = "Continue Shopping";

  summaryCard.append(summaryTitle, summaryDetails, checkoutBtn, continueShoppingLink);
  summarySection.append(summaryCard);

  return summarySection;
};

export const buildSummaryRow = async (label, value, valueId) => {
  const row = document.createElement("div");
  row.className = "cart-summary-row";

  const labelSpan = document.createElement("span");
  labelSpan.className = "cart-summary-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "cart-summary-value";
  valueSpan.id = valueId;
  valueSpan.textContent = value;

  row.append(labelSpan, valueSpan);

  return row;
};

export const buildCartItem = async (itemData) => {
  const cartItem = document.createElement("div");
  cartItem.className = "cart-item";
  cartItem.setAttribute("data-product-id", itemData.productId);

  const itemImage = await buildCartItemImage(itemData);
  const itemDetails = await buildCartItemDetails(itemData);
  const itemActions = await buildCartItemActions(itemData);

  cartItem.append(itemImage, itemDetails, itemActions);

  return cartItem;
};

export const buildCartItemImage = async (itemData) => {
  const imageContainer = document.createElement("div");
  imageContainer.className = "cart-item-image-container";

  const image = document.createElement("img");
  image.className = "cart-item-image";
  image.src = itemData.image;
  image.alt = itemData.name;

  imageContainer.append(image);

  return imageContainer;
};

export const buildCartItemDetails = async (itemData) => {
  const details = document.createElement("div");
  details.className = "cart-item-details";

  const itemTotal = document.createElement("div");
  itemTotal.className = "cart-item-total";
  itemTotal.id = `item-total-${itemData.productId}`;
  const totalValue = itemData.price * itemData.quantity;
  itemTotal.textContent = `$${totalValue.toFixed(2)}`;

  const name = document.createElement("h3");
  name.className = "cart-item-name";
  name.textContent = itemData.name;

  details.append(itemTotal, name);

  return details;
};

export const buildCartItemActions = async (itemData) => {
  const actions = document.createElement("div");
  actions.className = "cart-item-actions";

  // const itemTotal = await buildItemTotal(itemData);
  const quantityControl = await buildQuantityControl(itemData);
  const removeBtn = await buildRemoveButton(itemData);

  // actions.append(itemTotal, quantityControl, removeBtn);
  actions.append(quantityControl, removeBtn);

  return actions;
};

export const buildQuantityControl = async (itemData) => {
  const control = document.createElement("div");
  control.className = "cart-quantity-control";

  const label = document.createElement("span");
  label.className = "cart-quantity-label";
  label.textContent = "Quantity:";

  const btnGroup = document.createElement("div");
  btnGroup.className = "cart-quantity-buttons";

  const decreaseBtn = document.createElement("button");
  decreaseBtn.className = "cart-quantity-btn";
  decreaseBtn.textContent = "-";
  decreaseBtn.setAttribute("data-label", "decrease-quantity");
  decreaseBtn.setAttribute("data-product-id", itemData.productId);

  const quantityDisplay = document.createElement("span");
  quantityDisplay.className = "cart-quantity-display";
  quantityDisplay.id = `quantity-${itemData.productId}`;
  quantityDisplay.textContent = itemData.quantity;

  const increaseBtn = document.createElement("button");
  increaseBtn.className = "cart-quantity-btn";
  increaseBtn.textContent = "+";
  increaseBtn.setAttribute("data-label", "increase-quantity");
  increaseBtn.setAttribute("data-product-id", itemData.productId);

  btnGroup.append(decreaseBtn, quantityDisplay, increaseBtn);
  control.append(label, btnGroup);

  return control;
};

export const buildRemoveButton = async (itemData) => {
  const removeBtn = document.createElement("button");
  removeBtn.className = "cart-remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.setAttribute("data-label", "remove-from-cart");
  removeBtn.setAttribute("data-product-id", itemData.productId);

  return removeBtn;
};

export const buildItemTotal = async (itemData) => {
  const total = document.createElement("div");
  total.className = "cart-item-total";
  total.id = `item-total-${itemData.productId}`;

  const totalValue = itemData.price * itemData.quantity;
  total.textContent = `$${totalValue.toFixed(2)}`;

  return total;
};

export const buildEmptyCart = async () => {
  const emptyContainer = document.createElement("div");
  emptyContainer.className = "cart-empty";
  emptyContainer.id = "cart-empty";

  const emptyIcon = document.createElement("div");
  emptyIcon.className = "cart-empty-icon";
  emptyIcon.textContent = "🛒";

  const emptyMessage = document.createElement("p");
  emptyMessage.className = "cart-empty-message";
  emptyMessage.textContent = "Your cart is empty";

  const shopLink = document.createElement("a");
  shopLink.className = "cart-empty-link";
  shopLink.href = "/products";
  shopLink.textContent = "Start Shopping";

  emptyContainer.append(emptyIcon, emptyMessage, shopLink);

  return emptyContainer;
};

//-------------------

export const buildShippingSection = async () => {
  const shippingSection = document.createElement("div");
  shippingSection.className = "shipping-calculator-card";

  const shippingTitle = document.createElement("h2");
  shippingTitle.className = "shipping-calculator-title";
  shippingTitle.textContent = "View Shipping Cost";

  const shippingForm = document.createElement("div");
  shippingForm.className = "shipping-calculator-form";

  const zipInput = document.createElement("input");
  zipInput.type = "text";
  zipInput.className = "shipping-calculator-input";
  zipInput.id = "cart-shipping-zip-input";
  zipInput.placeholder = "Enter ZIP Code";
  zipInput.maxLength = "5";

  const calculateBtn = document.createElement("button");
  calculateBtn.className = "shipping-calculator-btn";
  calculateBtn.id = "cart-shipping-calculate-btn";
  calculateBtn.textContent = "Estimate Shipping";
  calculateBtn.setAttribute("data-label", "calculate-shipping");

  shippingForm.append(zipInput, calculateBtn);

  const resultContainer = document.createElement("div");
  resultContainer.id = "shipping-calculator-result";
  resultContainer.className = "shipping-calculator-result hidden";

  shippingSection.append(shippingTitle, shippingForm, resultContainer);

  return shippingSection;
};

export const buildShippingOption = async (rateData) => {
  const optionDiv = document.createElement("div");
  optionDiv.className = "shipping-option";
  optionDiv.setAttribute("data-rate", JSON.stringify(rateData));
  optionDiv.setAttribute("data-label", "shipping-option-select");

  const radioInput = document.createElement("input");
  radioInput.type = "radio";
  radioInput.name = "shipping-option";
  radioInput.id = `shipping-${rateData.rateId}`;
  radioInput.className = "shipping-option-radio";
  radioInput.value = rateData.shipping_amount.amount;

  const contentDiv = document.createElement("div");
  contentDiv.className = "shipping-option-content";
  contentDiv.setAttribute("data-label", "shipping-option-select");

  const headerDiv = document.createElement("div");
  headerDiv.className = "shipping-option-header";
  headerDiv.setAttribute("data-label", "shipping-option-select");

  const nameSpan = document.createElement("span");
  nameSpan.className = "shipping-option-name";
  nameSpan.textContent = `${rateData.carrier_friendly_name} - ${rateData.service_type}`;
  nameSpan.setAttribute("data-label", "shipping-option-select");

  const priceSpan = document.createElement("span");
  priceSpan.className = "shipping-option-price";
  priceSpan.textContent = `$${rateData.shipping_amount.amount.toFixed(2)}`;
  priceSpan.setAttribute("data-label", "shipping-option-select");

  headerDiv.append(nameSpan, priceSpan);

  const detailsDiv = document.createElement("div");
  detailsDiv.className = "shipping-option-details";
  detailsDiv.setAttribute("data-label", "shipping-option-select");

  if (rateData.delivery_days) {
    const deliverySpan = document.createElement("span");
    deliverySpan.textContent = `${rateData.delivery_days} business days`;
    deliverySpan.setAttribute("data-label", "shipping-option-select");
    detailsDiv.appendChild(deliverySpan);
  }

  if (rateData.estimated_delivery_date) {
    const dateSpan = document.createElement("span");
    const deliveryDate = new Date(rateData.estimated_delivery_date);
    dateSpan.textContent = `Est. delivery: ${deliveryDate.toLocaleDateString()}`;
    dateSpan.setAttribute("data-label", "shipping-option-select");
    detailsDiv.appendChild(dateSpan);
  }

  // Add badges for special attributes
  // if (rateData.rate_attributes && rateData.rate_attributes.length > 0) {
  //   const badgesDiv = document.createElement("div");
  //   badgesDiv.className = "shipping-option-badges";
  //   badgesDiv.setAttribute("data-label", "shipping-option-select");

  //   for (const attribute of rateData.rate_attributes) {
  //     if (attribute.includes("best_value")) continue;

  //     const badge = document.createElement("span");
  //     badge.className = `shipping-badge shipping-badge-${attribute}`;
  //     badge.textContent = attribute.replace("_", " ");
  //     badge.setAttribute("data-label", "shipping-option-select");
  //     badgesDiv.appendChild(badge);
  //   }

  //   detailsDiv.appendChild(badgesDiv);
  // }

  contentDiv.append(headerDiv, detailsDiv);
  optionDiv.append(radioInput, contentDiv);

  return optionDiv;
};
