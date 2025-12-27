// forms/cart-form.js
export const buildCartForm = async () => {
  const cartContainer = document.createElement("div");
  cartContainer.className = "cart-container";

  const pageHeader = await buildCartPageHeader();
  const cartContent = await buildCartContent();

  cartContainer.append(pageHeader, cartContent);

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

  const cartItemsSection = await buildCartItemsSection();
  const cartSummarySection = await buildCartSummarySection();

  cartContent.append(cartItemsSection, cartSummarySection);

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

  summaryDetails.append(itemCountRow, subtotalRow, totalRow);

  const checkoutBtn = document.createElement("button");
  checkoutBtn.className = "cart-checkout-btn";
  checkoutBtn.id = "cart-checkout-btn";
  checkoutBtn.textContent = "Proceed to Checkout";
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

// Build individual cart item
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

  const name = document.createElement("h3");
  name.className = "cart-item-name";
  name.textContent = itemData.name;

  const price = document.createElement("div");
  price.className = "cart-item-price";
  price.textContent = `$${itemData.price}`;

  details.append(name, price);

  return details;
};

export const buildCartItemActions = async (itemData) => {
  const actions = document.createElement("div");
  actions.className = "cart-item-actions";

  const quantityControl = await buildQuantityControl(itemData);
  const removeBtn = await buildRemoveButton(itemData);
  const itemTotal = await buildItemTotal(itemData);

  actions.append(quantityControl, itemTotal, removeBtn);

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
