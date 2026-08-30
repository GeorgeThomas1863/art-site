import { buildCollapseContainer } from "../util/collapse.js";

export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-dashboard-wrapper";

  const dashboardHeader = await buildDashboardHeader();
  const productsSection = await buildProductsSection();
  const eventsSection = await buildEventsSection();
  const newsletterSection = await buildNewsletterSection();
  const statsSection = await buildStatsSection();

  const statsWrapper = document.createElement("div");
  statsWrapper.className = "stats-wrapper";

  const statsControls = document.createElement("div");
  statsControls.className = "stats-controls";

  const statsRefreshButton = document.createElement("button");
  statsRefreshButton.className = "btn-admin-stats-refresh";
  statsRefreshButton.type = "button";
  statsRefreshButton.textContent = "↺ Refresh Stats";
  statsRefreshButton.setAttribute("data-label", "refresh-admin-stats");

  statsControls.append(statsRefreshButton);
  statsWrapper.append(statsControls, statsSection);

  adminFormWrapper.append(dashboardHeader, productsSection, eventsSection, newsletterSection, statsWrapper);

  return adminFormWrapper;
};

export const buildDashboardHeader = async () => {
  const header = document.createElement("div");
  header.className = "dashboard-header";

  const title = document.createElement("h1");
  title.className = "dashboard-title";
  title.textContent = "ADMIN DASHBOARD";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-subtitle";
  subtitle.textContent = "Manage your products and events";

  // Opens the categories modal via the generic open-modal-<mode>-<entityType> trigger
  const editCategoriesBtn = document.createElement("button");
  editCategoriesBtn.className = "btn btn-edit-categories";
  editCategoriesBtn.type = "button";
  editCategoriesBtn.textContent = "🏷️ Edit Product Categories";
  editCategoriesBtn.setAttribute("data-label", "open-modal-edit-categories");

  const viewBtn = document.createElement("button");
  viewBtn.className = "btn";
  viewBtn.textContent = "View Products";
  viewBtn.setAttribute("data-label", "view-products-btn");

  const viewNewslettersBtn = document.createElement("button");
  viewNewslettersBtn.className = "btn";
  viewNewslettersBtn.textContent = "View Newsletters";
  viewNewslettersBtn.setAttribute("data-label", "view-newsletters-btn");

  const headerActions = document.createElement("div");
  headerActions.className = "header-actions";
  headerActions.append(editCategoriesBtn, viewBtn, viewNewslettersBtn);

  header.append(title, subtitle, headerActions);

  return header;
};

export const buildProductsSection = async () => {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "📦 PRODUCTS";

  const actionCards = document.createElement("div");
  actionCards.className = "action-cards";

  const addCard = await buildActionCard("add", "products");
  const editCard = await buildActionCard("edit", "products");

  actionCards.append(addCard, editCard);

  const collapseContainer = await buildCollapseContainer({
    titleElement: title,
    contentElement: actionCards,
    isExpanded: true,
    dataAttribute: "products-collapse",
  });

  section.append(collapseContainer);

  return section;
};

// 1-3 letter text input for a category's product-code prefix; any A-Z combo is allowed, duplicates included
export const buildLetterInput = (id, letter) => {
  const input = document.createElement("input");
  input.className = "form-input";
  input.type = "text";
  input.id = id;
  input.name = id;
  input.maxLength = 3;
  input.value = letter || "";

  return input;
};

// Label-over-control column for the add-category row (name field, prefix picker)
const buildAddCategoryField = (labelText, control) => {
  const field = document.createElement("div");
  field.className = "add-category-field";

  const label = document.createElement("label");
  label.className = "form-label";
  label.textContent = labelText;
  label.setAttribute("for", control.id);

  field.append(label, control);
  return field;
};

// Body of the Edit Categories modal (add row + current list); list is filled by loadCategories on open
export const buildCategoriesContent = async () => {
  const addCategorySection = document.createElement("div");
  addCategorySection.className = "add-category-section";

  const addCategoryRow = document.createElement("div");
  addCategoryRow.className = "add-category-row";

  const categoryTitleInput = document.createElement("input");
  categoryTitleInput.className = "form-input";
  categoryTitleInput.type = "text";
  categoryTitleInput.id = "new-category-title";
  categoryTitleInput.name = "new-category-title";
  categoryTitleInput.placeholder = "Any name, e.g. Acorns";
  categoryTitleInput.maxLength = 60;
  const categoryTitleField = buildAddCategoryField("Add New Category", categoryTitleInput);
  categoryTitleField.classList.add("add-category-field-title");

  const categoryLetterInput = buildLetterInput("new-category-letter", "A");
  categoryLetterInput.title = "Product Code prefix for this category";
  const categoryLetterField = buildAddCategoryField("Prefix", categoryLetterInput);

  const addCategoryButton = document.createElement("button");
  addCategoryButton.className = "btn btn-add-category";
  addCategoryButton.type = "button";
  addCategoryButton.textContent = "Add Category";
  addCategoryButton.setAttribute("data-label", "add-category");

  addCategoryRow.append(categoryTitleField, categoryLetterField, addCategoryButton);
  addCategorySection.append(addCategoryRow);

  const listHeader = document.createElement("div");
  listHeader.className = "category-list-header";

  const listLabel = document.createElement("label");
  listLabel.className = "form-label category-list-label";
  listLabel.textContent = "Current Categories";

  const refreshButton = document.createElement("button");
  refreshButton.className = "btn-admin-refresh";
  refreshButton.type = "button";
  refreshButton.textContent = "↺ Refresh List";
  refreshButton.setAttribute("data-label", "refresh-category-list");

  listHeader.append(listLabel, refreshButton);

  const categoryList = document.createElement("div");
  categoryList.className = "category-list";
  categoryList.id = "category-list";

  const emptyState = document.createElement("div");
  emptyState.className = "category-empty-state";
  emptyState.textContent = "Loading categories…";
  categoryList.append(emptyState);

  const categoryContainer = document.createElement("div");
  categoryContainer.className = "category-container";
  categoryContainer.append(listHeader, categoryList);

  const content = document.createElement("div");
  content.className = "categories-content";
  content.append(addCategorySection, categoryContainer);

  return content;
};

export const buildEventsSection = async () => {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "📅 EVENTS";

  const actionCards = document.createElement("div");
  actionCards.className = "action-cards";

  const addCard = await buildActionCard("add", "events");
  const editCard = await buildActionCard("edit", "events");

  actionCards.append(addCard, editCard);

  const collapseContainer = await buildCollapseContainer({
    titleElement: title,
    contentElement: actionCards,
    isExpanded: true,
    dataAttribute: "events-collapse",
  });

  section.append(collapseContainer);

  return section;
};

export const buildNewsletterSection = async () => {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "📧 NEWSLETTER";

  const actionCards = document.createElement("div");
  actionCards.className = "action-cards";

  const writeCard = await buildActionCard("write", "newsletter");
  const manageCard = await buildActionCard("edit", "newsletter");
  const mailingListCard = await buildActionCard("edit", "mailinglist");

  writeCard.classList.add("action-card-tall");
  manageCard.classList.add("action-card-compact");
  mailingListCard.classList.add("action-card-compact");
  actionCards.append(writeCard, manageCard, mailingListCard);

  const collapseContainer = await buildCollapseContainer({
    titleElement: title,
    contentElement: actionCards,
    isExpanded: true,
    dataAttribute: "newsletter-collapse",
  });

  section.append(collapseContainer);

  return section;
};

export const buildStatsSection = async () => {
  const section = document.createElement("div");
  section.className = "stats-section";

  const stats = [
    { icon: "📦", value: "0", label: "Products", id: "total-products-stat" },
    { icon: "👁️", value: "0", label: "Displayed", id: "displayed-products-stat" },
    { icon: "✅", value: "0", label: "Sold", id: "sold-products-stat" },
    { icon: "📅", value: "0", label: "Events", id: "upcoming-events-stat" },
    { icon: "📧", value: "0", label: "Subscribers", id: "total-subscribers-stat" },
  ];

  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    const statItem = document.createElement("div");
    statItem.className = "stat-item";

    const icon = document.createElement("div");
    icon.className = "stat-icon";
    icon.textContent = stat.icon;

    const value = document.createElement("div");
    value.className = "stat-value";
    value.id = stat.id;
    value.textContent = stat.value;

    const label = document.createElement("div");
    label.className = "stat-label";
    label.textContent = stat.label;

    statItem.append(icon, value, label);
    section.append(statItem);
  }

  return section;
};

export const buildActionCard = async (mode, entityType) => {
  const card = document.createElement("div");
  card.className = "action-card";
  card.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const icon = document.createElement("div");
  icon.className = "action-icon";

  if (entityType === "newsletter") {
    icon.textContent = mode === "write" ? "✍️" : "🗂️";
  } else if (entityType === "mailinglist") {
    icon.textContent = "📝";
  } else {
    icon.textContent = mode === "add" ? "➕" : "✏️";
  }
  icon.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const title = document.createElement("div");
  title.className = "action-title";

  let entityName;
  let titleText;
  let descText;

  if (entityType === "newsletter") {
    titleText = mode === "write" ? "Write Newsletter" : "Edit Newsletter";
    descText = mode === "write" ? "Compose and send a newsletter to all subscribers" : "View, edit, or delete previously sent newsletters";
  } else if (entityType === "mailinglist") {
    titleText = "Edit Mailing List";
    descText = "Add or remove email addresses from your mailing list";
  } else {
    entityName = entityType === "products" ? "Product" : "Event";
    titleText = mode === "add" ? `Add New ${entityName}` : `Edit ${entityName}`;
    descText =
      mode === "add"
        ? `Create a new ${entityName.toLowerCase()} listing with images and details`
        : `Modify or delete existing ${entityName.toLowerCase()}s`;
  }

  title.textContent = titleText;
  title.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const description = document.createElement("div");
  description.className = "action-description";
  description.textContent = descText;
  description.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  card.append(icon, title, description);

  return card;
};

//+++++++++++++++++++++++++++++++++++++

// Modal Container
export const buildModal = async (mode, entityType) => {
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.id = `${mode}-${entityType}-modal`;

  const modalWrapper = document.createElement("div");
  modalWrapper.className = "modal-wrapper";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = await buildModalHeader(mode, entityType);
  const modalBody = await buildModalBody(mode, entityType);
  const modalActions = await buildModalActions(mode, entityType);

  modalContent.append(modalBody, modalActions);
  modalWrapper.append(modalHeader, modalContent);

  modalOverlay.append(modalWrapper);

  return modalOverlay;
};

// Modal Header
export const buildModalHeader = async (mode, entityType) => {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.className = "modal-title";

  let titleText;
  if (entityType === "newsletter") {
    titleText = mode === "write" ? "WRITE NEWSLETTER" : "EDIT NEWSLETTER";
  } else if (entityType === "mailinglist") {
    titleText = "EDIT MAILING LIST";
  } else if (entityType === "categories") {
    titleText = "EDIT CATEGORIES";
  } else {
    const entityName = entityType === "products" ? "PRODUCT" : "EVENT";
    titleText = mode === "add" ? `ADD NEW ${entityName}` : `EDIT ${entityName}`;
  }

  title.textContent = titleText;

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  closeButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  header.append(title, closeButton);

  return header;
};

// Modal Body - UPDATED for new layout
export const buildModalBody = async (mode, entityType) => {
  const body = document.createElement("div");
  body.className = "modal-body";

  // Add selector for edit mode
  if (mode === "edit" && (entityType === "products" || entityType === "events")) {
    const selector = entityType === "products" ? await buildAdminProductSelector() : await buildAdminEventSelector();
    body.append(selector);
  }

  if (entityType === "newsletter" && mode === "write") {
    const subjectField = await buildNewsletterSubject();
    const messageField = await buildNewsletterMessage();
    body.append(subjectField, messageField);
    return body;
  }

  if (entityType === "newsletter" && mode === "edit") {
    const selector = await buildAdminNewsletterSelector();
    const editorSection = await buildEditNewsletterSection();
    body.append(selector, editorSection);
    return body;
  }

  if (entityType === "mailinglist") {
    const mailingListSection = await buildMailingListSection();
    body.append(mailingListSection);
    return body;
  }

  if (entityType === "categories") {
    const categoriesContent = await buildCategoriesContent();
    body.append(categoriesContent);
    return body;
  }

  // Build form fields based on entity type - NEW SECTIONED LAYOUT
  if (entityType === "products") {
    // Section 1: Product Details
    const detailsSection = await buildProductDetailsSection(mode);

    const subscriberSection = mode === "add" ? await buildProductSubscriberSection() : null;

    // Section 2: Product Status
    const statusSection = await buildProductStatusSection(mode);

    // Section 3: Shipping Information
    const shippingSection = await buildProductShippingSection(mode);

    // Section 4: Product Image
    const imageSection = await buildProductImageSection(mode);

    body.append(detailsSection);
    if (subscriberSection) body.append(subscriberSection);
    body.append(statusSection, shippingSection, imageSection);
    return body;
  }

  // Events layout (keep similar structure)
  const detailsSection = await buildEventDetailsSection(mode);
  const imageSection = await buildEventImageSection(mode);

  body.append(detailsSection, imageSection);

  return body;
};

export const buildModalActions = async (mode, entityType) => {
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  // Delete button for edit mode
  if (mode === "edit" && (entityType === "products" || entityType === "events" || entityType === "newsletter")) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-admin-delete";
    deleteButton.type = "button";
    if (entityType === "products") {
      deleteButton.id = "delete-product-button";
      deleteButton.setAttribute("data-label", "delete-product-submit");
    } else if (entityType === "events") {
      deleteButton.id = "delete-event-button";
      deleteButton.setAttribute("data-label", "delete-event-submit");
    } else {
      deleteButton.id = "delete-newsletter-button";
      deleteButton.setAttribute("data-label", "delete-newsletter-submit");
    }
    deleteButton.textContent = "Delete";
    deleteButton.disabled = true;
    actions.append(deleteButton);
  }

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-admin-cancel";
  cancelButton.type = "button";
  cancelButton.textContent = entityType === "mailinglist" || entityType === "categories" ? "Done" : "Cancel";
  cancelButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  // Categories save on every add/delete, so the only action is closing
  if (entityType === "categories") {
    actions.append(cancelButton);
    return actions;
  }

  // Submit button
  const submitButton = document.createElement("button");
  submitButton.className = "btn btn-admin-submit";
  submitButton.type = "button";

  let submitId;
  let submitLabel;
  let submitText;

  if (entityType === "newsletter" && mode === "write") {
    submitId = "send-newsletter-button";
    submitLabel = "send-newsletter-submit";
    submitText = "Send Newsletter";
  } else if (entityType === "newsletter" && mode === "edit") {
    submitId = "edit-newsletter-submit-button";
    submitLabel = "edit-newsletter-submit";
    submitText = "Update";
  } else if (entityType === "mailinglist") {
    submitId = "save-mailing-list-button";
    submitLabel = "save-mailing-list-submit";
    submitText = "Save Changes";
  } else if (entityType === "products") {
    submitId = mode === "add" ? "submit-button" : "edit-submit-button";
    submitLabel = mode === "add" ? "new-product-submit" : "edit-product-submit";
    submitText = mode === "add" ? "Submit" : "Update";
  } else {
    submitId = mode === "add" ? "event-submit-button" : "edit-event-submit-button";
    submitLabel = mode === "add" ? "new-event-submit" : "edit-event-submit";
    submitText = mode === "add" ? "Submit" : "Update";
  }
  submitButton.id = submitId;
  submitButton.textContent = submitText;
  submitButton.setAttribute("data-label", submitLabel);

  if (mode === "edit" && (entityType === "products" || entityType === "events" || entityType === "newsletter")) {
    submitButton.disabled = true;
  }

  let testButton = null;
  if (entityType === "newsletter" && mode === "write") {
    testButton = document.createElement("button");
    testButton.className = "btn btn-admin-test";
    testButton.type = "button";
    testButton.id = "send-test-newsletter-button";
    testButton.textContent = "Send Test Newsletter";
    testButton.setAttribute("data-label", "send-test-newsletter-submit");
  }

  if (entityType === "mailinglist") {
    actions.append(cancelButton);
  } else if (testButton) {
    actions.append(cancelButton, testButton, submitButton);
  } else {
    actions.append(cancelButton, submitButton);
  }

  return actions;
};

// NEW SECTIONED LAYOUT BUILDERS
//+++++++++++++++++++++++++++++

// NEW FUNCTION: Product Details Section
export const buildProductDetailsSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📦";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Product Details";

  header.append(icon, title);

  // Product Code Row
  const productCodeRow = await buildInfoRow(mode, "product-code", "Product Code");
  if (mode === "add") {
    const productCodeHint = document.createElement("div");
    productCodeHint.className = "product-code-hint";
    productCodeHint.textContent = "Leave blank to auto-assign";
    const productCodeContentWrapper = productCodeRow.querySelector(".info-content-wrapper");
    if (productCodeContentWrapper) productCodeContentWrapper.append(productCodeHint);
  }

  // Product Name Row
  const nameRow = await buildInfoRow(mode, "name", "Product Name");
  if (mode === "add") {
    nameRow.querySelector('input').setAttribute('data-label', 'admin-product-name-input');
  }

  // URL Ending Row
  const slugRow = await buildInfoRow(mode, "url-name", "URL Ending");

  // Type Row
  const typeRow = await buildInfoRowSelect(mode, "product-type", "Product Type", []);

  // Price Row
  const priceRow = await buildInfoRowPrice(mode, "price", "Price");

  // Description Row
  const descRow = await buildInfoRowTextarea(mode, "description", "Description");

  if (mode === "add") {
    section.append(header, typeRow, productCodeRow, nameRow, priceRow, descRow, slugRow);
  } else {
    section.append(header, productCodeRow, nameRow, typeRow, priceRow, descRow, slugRow);
  }

  return section;
};

// NEW FUNCTION: Product Status Section
export const buildProductStatusSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "⚙️";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Product Status";

  header.append(icon, title);

  const statusGrid = document.createElement("div");
  statusGrid.className = "status-grid";

  // Display Status Card
  const displayCard = await buildStatusCard(mode, "display", "Show on Site", "display-card");

  // Sold Status Card
  const soldCard = await buildStatusCard(mode, "sold", "Sold?", "sold-card");

  // Can Ship Status Card
  const canShipCard = await buildStatusCard(mode, "can-ship", "Can Ship", "can-ship-card");

  statusGrid.append(soldCard, displayCard, canShipCard);
  section.append(header, statusGrid);

  return section;
};

// NEW FUNCTION: Product Shipping Section
export const buildProductShippingSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";
  section.id = mode === "add" ? "add-shipping-section" : "edit-shipping-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📏";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Shipping Information";

  header.append(icon, title);

  const shippingLayout = document.createElement("div");
  shippingLayout.className = "shipping-layout";

  const col1 = document.createElement("div");
  col1.className = "shipping-col";

  const col2 = document.createElement("div");
  col2.className = "shipping-col";

  // Dimensions
  const lengthItem = await buildShippingItem(mode, "length", "Length", 8);
  const widthItem = await buildShippingItem(mode, "width", "Width", 6);
  const heightItem = await buildShippingItem(mode, "height", "Height", 6);
  const weightItem = await buildShippingItem(mode, "weight", "Weight", 2);

  col1.append(lengthItem, widthItem, heightItem);
  col2.append(weightItem);

  shippingLayout.append(col1, col2);
  section.append(header, shippingLayout);

  return section;
};

// NEW FUNCTION: Product Image Section
export const buildProductImageSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section product-section-last";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📷";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Product Images";

  header.append(icon, title);

  const slotsContainer = document.createElement("div");
  slotsContainer.className = "pic-slots-container";

  const initialSlot = buildPicSlot(0);
  if (mode === "edit") {
    const slotUploadBtn = initialSlot.querySelector(".upload-btn");
    const slotFileInput = initialSlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
  }
  slotsContainer.append(initialSlot);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-add-image";
  addBtn.textContent = "+ Add Image";
  addBtn.setAttribute("data-label", "add-pic-slot");
  if (mode === "edit") addBtn.disabled = true;

  section.append(header, slotsContainer, addBtn);

  return section;
};

export const buildPicSlot = (index, entityType = "products") => {
  const slot = document.createElement("div");
  slot.className = "pic-slot";
  slot.setAttribute("data-slot-index", String(index));

  const imageDisplay = document.createElement("div");
  imageDisplay.className = "image-display";

  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "image-placeholder";
  imagePlaceholder.textContent = "🖼️";

  const currentImage = document.createElement("img");
  currentImage.className = "current-image hidden";
  currentImage.alt = "Product image";

  const currentVideo = document.createElement("video");
  currentVideo.className = "current-video hidden";
  currentVideo.controls = true;

  const deleteImageBtn = document.createElement("button");
  deleteImageBtn.type = "button";
  deleteImageBtn.className = "delete-image-btn hidden";
  deleteImageBtn.innerHTML = "×";
  deleteImageBtn.title = "Delete file";
  deleteImageBtn.setAttribute("data-label", "delete-slot-image");

  imageDisplay.append(imagePlaceholder, currentImage, currentVideo, deleteImageBtn);

  const picInput = document.createElement("input");
  picInput.type = "file";
  picInput.className = "pic-file-input hidden";
  picInput.accept = ".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov";

  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "upload-btn";
  uploadBtn.textContent = "Choose File";
  uploadBtn.setAttribute("data-label", "slot-upload-click");
  uploadBtn.entityType = entityType;

  const uploadStatus = document.createElement("span");
  uploadStatus.className = "upload-status hidden";

  const removeSlotBtn = document.createElement("button");
  removeSlotBtn.type = "button";
  removeSlotBtn.className = "remove-slot-btn";
  removeSlotBtn.textContent = "Remove slot";
  removeSlotBtn.setAttribute("data-label", "remove-pic-slot");
  if (index === 0) removeSlotBtn.classList.add("hidden");

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'edit-image-btn hidden';
  editBtn.setAttribute('data-label', 'edit-slot-image');
  editBtn.textContent = 'Edit Image';

  const actionsRow = document.createElement('div');
  actionsRow.className = 'slot-image-actions';
  actionsRow.append(uploadBtn, editBtn);

  slot.append(imageDisplay, picInput, actionsRow, uploadStatus, removeSlotBtn);

  return slot;
};

// NEW HELPER: Build Info Row (for text inputs)
export const buildInfoRow = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const input = document.createElement("input");
  input.className = "info-content info-input";
  input.type = "text";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    input.disabled = true;
  }

  contentWrapper.append(input);
  row.append(label, contentWrapper);

  return row;
};

//--------------

export const buildInfoRowPrice = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const input = document.createElement("input");
  input.className = "info-content info-input";
  input.type = "number";
  input.min = "0";
  input.step = "1.00";
  input.placeholder = "0.00";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    input.disabled = true;
  }

  contentWrapper.append(input);
  row.append(label, contentWrapper);

  return row;
};

//--------------

export const buildInfoRowSelect = async (mode, fieldName, labelText, options) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const select = document.createElement("select");
  select.className = "info-content info-select";
  select.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  select.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    select.disabled = true;
  }

  for (let i = 0; i < options.length; i++) {
    const optionData = options[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    select.append(option);
  }

  contentWrapper.append(select);
  row.append(label, contentWrapper);

  return row;
};

// NEW HELPER: Build Info Row with Textarea
export const buildInfoRowTextarea = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const textarea = document.createElement("textarea");
  textarea.className = "info-content info-textarea";
  textarea.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  textarea.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    textarea.disabled = true;
  }

  contentWrapper.append(textarea);
  row.append(label, contentWrapper);

  return row;
};

// NEW HELPER: Build Status Card
export const buildStatusCard = async (mode, fieldName, labelText, dataLabel = null) => {
  const card = document.createElement("div");
  card.className = "status-card";

  const label = document.createElement("div");
  label.className = "status-label";
  label.textContent = labelText;

  const select = document.createElement("select");
  select.className = "status-select";
  select.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  select.name = mode === "add" ? fieldName : `edit-${fieldName}`;
  if (dataLabel) {
    select.setAttribute("data-label", dataLabel);
  }

  if (mode === "edit") {
    select.disabled = true;
  }

  const yesOption = document.createElement("option");
  yesOption.value = "yes";
  yesOption.textContent = "Yes";
  if (fieldName === "display" || fieldName === "can-ship") {
    yesOption.selected = true;
  }

  const noOption = document.createElement("option");
  noOption.value = "no";
  noOption.textContent = "No";
  if (fieldName === "sold") {
    noOption.selected = true;
  }

  select.append(yesOption, noOption);

  // Set initial color class
  const initialValue = fieldName === "sold" ? "no" : "yes";
  select.classList.add(`status-${initialValue}`);

  card.append(label, select);

  return card;
};

// NEW HELPER: Build Shipping Item
export const buildShippingItem = async (mode, fieldName, labelText, defaultValue = null) => {
  const item = document.createElement("div");
  item.className = "shipping-item";

  const label = document.createElement("span");
  label.className = "shipping-label";
  label.textContent = labelText;

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "shipping-value-wrapper";

  const input = document.createElement("input");
  input.className = "shipping-value shipping-input";
  input.type = "text";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.placeholder = defaultValue !== null ? String(defaultValue) : "0";

  if (mode === "edit") {
    input.disabled = true;
  }

  const unit = document.createElement("span");
  unit.className = "shipping-unit";
  unit.textContent = fieldName === "weight" ? "lbs" : "in";

  inputWrapper.append(input, unit);
  item.append(label, inputWrapper);

  return item;
};

// NEW FUNCTIONS FOR EVENTS
export const buildEventDetailsSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📅";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Event Details";

  header.append(icon, title);

  const nameRow = await buildInfoRow(mode, "name", "Event Name");
  const dateRow = await buildInfoRowDate(mode, "event-date", "Event Date");
  const locationRow = await buildInfoRow(mode, "event-location", "Location");
  const descRow = await buildInfoRowTextarea(mode, "event-description", "Description");

  section.append(header, nameRow, dateRow, locationRow, descRow);

  return section;
};

export const buildInfoRowDate = async (mode, fieldName, labelText) => {
  const row = document.createElement("div");
  row.className = "info-row";

  const label = document.createElement("div");
  label.className = "info-label";
  label.textContent = labelText;

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "info-content-wrapper";

  const input = document.createElement("input");
  input.className = "info-content info-input";
  input.type = "date";
  input.id = mode === "add" ? fieldName : `edit-${fieldName}`;
  input.name = mode === "add" ? fieldName : `edit-${fieldName}`;

  if (mode === "edit") {
    input.disabled = true;
  }

  contentWrapper.append(input);
  row.append(label, contentWrapper);

  return row;
};

export const buildEventImageSection = async (mode) => {
  const section = document.createElement("div");
  section.className = "product-section product-section-last";

  const header = document.createElement("div");
  header.className = "section-header";

  const icon = document.createElement("span");
  icon.className = "section-icon";
  icon.textContent = "📷";

  const title = document.createElement("h4");
  title.className = "section-title";
  title.textContent = "Event Images";

  header.append(icon, title);

  const slotsContainer = document.createElement("div");
  slotsContainer.className = "pic-slots-container";

  const initialSlot = buildPicSlot(0, "events");
  if (mode === "edit") {
    const slotUploadBtn = initialSlot.querySelector(".upload-btn");
    const slotFileInput = initialSlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
  }
  slotsContainer.append(initialSlot);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-add-image";
  addBtn.textContent = "+ Add Image";
  addBtn.setAttribute("data-label", "add-pic-slot");
  if (mode === "edit") addBtn.disabled = true;

  section.append(header, slotsContainer, addBtn);

  return section;
};

//-------------------

//PRODUCT FORM FIELDS
export const buildAdminProductSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

  const filterLabel = document.createElement("label");
  filterLabel.setAttribute("for", "edit-product-filter");
  filterLabel.textContent = "Select Product Type";

  const typeFilter = document.createElement("select");
  typeFilter.className = "form-select";
  typeFilter.id = "edit-product-filter";
  typeFilter.name = "edit-product-filter";

  const allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All";
  allOption.selected = true;
  typeFilter.append(allOption);

  const productSelect = document.createElement("select");
  productSelect.className = "form-select";
  productSelect.id = "product-selector";
  productSelect.name = "product-selector";

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select a product --";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  productSelect.append(defaultOption);

  selectorWrapper.append(filterLabel, typeFilter, productSelect);

  return selectorWrapper;
};

export const buildAdminEventSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

  const selectorLabel = document.createElement("label");
  selectorLabel.className = "form-label";
  selectorLabel.id = "event-selector-label";
  selectorLabel.textContent = "Select Event to Edit";
  selectorLabel.setAttribute("for", "event-selector");

  const eventSelect = document.createElement("select");
  eventSelect.className = "form-select";
  eventSelect.id = "event-selector";
  eventSelect.name = "event-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select an event --";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  eventSelect.append(defaultOption);

  selectorWrapper.append(selectorLabel, eventSelect);

  return selectorWrapper;
};

export const buildAdminNewsletterSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

  const newsletterSelect = document.createElement("select");
  newsletterSelect.className = "form-select";
  newsletterSelect.id = "newsletter-archive-selector";
  newsletterSelect.name = "newsletter-archive-selector";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select a newsletter --";
  defaultOption.selected = true;
  defaultOption.disabled = true;
  newsletterSelect.append(defaultOption);

  selectorWrapper.append(newsletterSelect);

  return selectorWrapper;
};

export const buildEditNewsletterSection = async () => {
  const section = document.createElement("div");
  section.className = "newsletter-message-field";

  const editorContainer = document.createElement("div");
  editorContainer.id = "edit-newsletter-quill-editor";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "edit-newsletter-image-file-input";
  fileInput.accept = "image/*";
  fileInput.className = "hidden";

  section.append(editorContainer, fileInput);

  return section;
};


//NEWSLETTER FORM FIELDS

export const buildNewsletterSubject = async () => {
  const subjectWrapper = document.createElement("div");
  subjectWrapper.className = "form-field";

  const subjectLabel = document.createElement("label");
  subjectLabel.className = "form-label";
  subjectLabel.textContent = "Subject Line";
  subjectLabel.setAttribute("for", "newsletter-subject");

  const subjectInput = document.createElement("input");
  subjectInput.className = "form-input";
  subjectInput.type = "text";
  subjectInput.id = "newsletter-subject";
  subjectInput.name = "newsletter-subject";
  subjectInput.placeholder = "Enter newsletter subject...";

  subjectWrapper.append(subjectLabel, subjectInput);

  return subjectWrapper;
};

export const buildNewsletterMessage = async () => {
  const messageWrapper = document.createElement("div");
  messageWrapper.className = "form-field";

  const messageLabel = document.createElement("label");
  messageLabel.className = "form-label";
  messageLabel.textContent = "Message";

  // Quill mounts onto a plain div, not a textarea
  const editorContainer = document.createElement("div");
  editorContainer.id = "newsletter-quill-editor";
  editorContainer.className = "newsletter-quill-editor";

  // Hidden file input — triggered programmatically by the Quill image handler
  const imageFileInput = document.createElement("input");
  imageFileInput.type = "file";
  imageFileInput.id = "newsletter-image-file-input";
  imageFileInput.accept = ".jpg,.jpeg,.png,.gif,.webp";
  imageFileInput.style.display = "none";
  // The change listener is attached in initQuill() after the modal is in the DOM

  const quillWrapper = document.createElement("div");
  quillWrapper.className = "quill-editor-wrapper";
  quillWrapper.append(editorContainer);

  messageWrapper.append(messageLabel, quillWrapper, imageFileInput);

  return messageWrapper;
};

const CTA_SWATCH_COLORS = [
  ["#000000", "Black"],
  ["#ffffff", "White"],
  ["#808080", "Gray"],
  ["#d32f2f", "Red"],
  ["#f57c00", "Orange"],
  ["#fbc02d", "Yellow"],
  ["#388e3c", "Green"],
  ["#1976d2", "Blue"],
  ["#7b1fa2", "Purple"],
];

export const CTA_DEFAULT_TEXT = "Shop Now";

const CTA_ALIGN_OPTIONS = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
];

const CTA_RESIZE_CORNERS = ["nw", "ne", "sw", "se"];

export const buildCtaButtonDialog = async () => {
  const overlay = document.createElement("div");
  overlay.id = "cta-dialog";
  overlay.className = "cta-dialog";

  const content = document.createElement("div");
  content.className = "cta-dialog-content";

  const textField = buildCtaField("cta-text", "Button Text", "text", "e.g. Shop Now");
  const urlField = buildCtaField("cta-url", "Button Link", "url", "https://your-site.com/page");
  const urlHint = buildCtaUrlHint();
  urlField.append(urlHint);
  const colorField = buildCtaColorField("cta-bg-color", "Button Color", "#333333");
  const textColorField = buildCtaColorField("cta-text-color", "Text Color", "#ffffff");
  const alignField = buildCtaAlignField();
  const previewField = buildCtaPreview();
  const actions = buildCtaActions();

  content.append(textField, urlField, colorField, textColorField, alignField, previewField, actions);
  overlay.append(content);

  return overlay;
};

const buildCtaField = (id, labelText, type, placeholder) => {
  const field = document.createElement("div");
  field.className = "form-field";

  const label = document.createElement("label");
  label.className = "form-label";
  label.setAttribute("for", id);
  label.textContent = labelText;

  const input = document.createElement("input");
  input.className = "form-input";
  input.type = type;
  input.id = id;
  input.placeholder = placeholder;
  input.setAttribute("data-label", id);

  field.append(label, input);
  return field;
};

const buildCtaUrlHint = () => {
  const hint = document.createElement("p");
  hint.className = "cta-hint";
  hint.id = "cta-url-hint";
  hint.textContent = "Defaults to main page, can set to any link.";
  return hint;
};

const buildCtaColorField = (id, labelText, defaultValue) => {
  const field = document.createElement("div");
  field.className = "form-field";

  const label = document.createElement("label");
  label.className = "form-label";
  label.setAttribute("for", id);
  label.textContent = labelText;

  const colorRow = document.createElement("div");
  colorRow.className = "cta-color-row";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.id = id;
  colorInput.value = defaultValue;
  colorInput.setAttribute("data-label", id);

  const swatches = buildCtaSwatches(id);

  colorRow.append(colorInput, swatches);
  field.append(label, colorRow);
  return field;
};

const buildCtaSwatches = (targetId) => {
  const swatches = document.createElement("div");
  swatches.className = "cta-swatches";

  for (let i = 0; i < CTA_SWATCH_COLORS.length; i++) {
    const [color, name] = CTA_SWATCH_COLORS[i];
    const swatch = document.createElement("button");
    swatch.className = "cta-swatch";
    swatch.type = "button";
    swatch.setAttribute("data-color", color);
    swatch.setAttribute("data-target", targetId);
    swatch.title = name;
    swatch.setAttribute("aria-label", name);
    swatch.style.background = color;
    swatches.append(swatch);
  }

  return swatches;
};

const buildCtaAlignField = () => {
  const field = document.createElement("div");
  field.className = "form-field";

  const label = document.createElement("span");
  label.className = "form-label";
  label.textContent = "Position";

  const alignRow = document.createElement("div");
  alignRow.className = "cta-align-row";

  for (let i = 0; i < CTA_ALIGN_OPTIONS.length; i++) {
    const [align, text] = CTA_ALIGN_OPTIONS[i];
    const button = document.createElement("button");
    button.className = "cta-align";
    button.type = "button";
    button.setAttribute("data-align", align);
    button.setAttribute("data-label", `cta-align-${align}`);
    button.textContent = text;

    if (align === "center") {
      button.classList.add("selected");
    }

    alignRow.append(button);
  }

  field.append(label, alignRow);
  return field;
};

const buildCtaPreview = () => {
  const field = document.createElement("div");
  field.className = "form-field";

  const label = document.createElement("span");
  label.className = "form-label";
  label.textContent = "Preview";

  const previewWrap = document.createElement("div");
  previewWrap.className = "cta-preview-wrap";
  previewWrap.append(buildCtaPreviewBox());

  field.append(label, previewWrap, buildCtaPreviewTools());
  return field;
};

const buildCtaPreviewBox = () => {
  const box = document.createElement("span");
  box.className = "cta-preview-box";

  const preview = document.createElement("a");
  preview.id = "cta-preview";
  preview.href = "#";
  preview.textContent = CTA_DEFAULT_TEXT;
  preview.style.display = "inline-block";
  preview.style.padding = "12px 28px";
  preview.style.background = "#333333";
  preview.style.color = "#ffffff";
  preview.style.textDecoration = "none";
  preview.style.borderRadius = "4px";
  preview.style.fontWeight = "bold";

  box.append(preview);
  appendCtaResizeHandles(box);
  return box;
};

const appendCtaResizeHandles = (box) => {
  for (const corner of CTA_RESIZE_CORNERS) {
    box.append(buildCtaResizeHandle(corner));
  }
};

const buildCtaResizeHandle = (corner) => {
  const resizeHandle = document.createElement("button");
  resizeHandle.type = "button";
  resizeHandle.className = "cta-resize-handle";
  resizeHandle.setAttribute("data-corner", corner);
  resizeHandle.setAttribute("aria-label", `Drag ${corner} corner to resize button`);
  resizeHandle.title = "Drag to resize";
  resizeHandle.setAttribute("data-label", `cta-resize-handle-${corner}`);
  return resizeHandle;
};

const buildCtaPreviewTools = () => {
  const tools = document.createElement("div");
  tools.className = "cta-preview-tools";

  const tip = document.createElement("span");
  tip.className = "cta-preview-tip";
  tip.textContent = "Click and drag corner of the button to change its size.";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.id = "cta-size-reset";
  resetBtn.className = "revert-image-btn hidden";
  resetBtn.setAttribute("data-label", "cta-size-reset");
  resetBtn.textContent = "↩ Revert to default size";

  tools.append(tip, resetBtn);
  return tools;
};

const buildCtaActions = () => {
  const actions = document.createElement("div");
  actions.className = "cta-dialog-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-admin-cancel";
  cancelBtn.type = "button";
  cancelBtn.id = "cta-cancel";
  cancelBtn.textContent = "Cancel";
  cancelBtn.setAttribute("data-label", "cta-cancel");

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-admin-delete hidden";
  removeBtn.type = "button";
  removeBtn.id = "cta-remove";
  removeBtn.textContent = "Remove";
  removeBtn.setAttribute("data-label", "cta-remove");

  const insertBtn = document.createElement("button");
  insertBtn.className = "btn btn-admin-submit";
  insertBtn.type = "button";
  insertBtn.id = "cta-insert";
  insertBtn.textContent = "Add";
  insertBtn.setAttribute("data-label", "cta-insert");

  actions.append(cancelBtn, removeBtn, insertBtn);
  return actions;
};

export const buildProductSubscriberSection = async () => {
  const section = document.createElement("div");
  section.className = "product-section product-subscriber-section";

  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "checkbox-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "notify-subscribers";
  checkbox.setAttribute("data-label", "notify-subscribers");

  const label = document.createElement("label");
  label.setAttribute("for", "notify-subscribers");
  label.textContent = "Email newsletter subscribers about this product";

  const fields = document.createElement("div");
  fields.className = "product-email-fields";
  fields.hidden = true;

  const introField = document.createElement("div");
  introField.className = "form-field";

  const introLabel = document.createElement("label");
  introLabel.className = "form-label";
  introLabel.setAttribute("for", "product-email-intro");
  introLabel.textContent = "Email Message";

  const introInput = document.createElement("input");
  introInput.className = "form-input";
  introInput.type = "text";
  introInput.id = "product-email-intro";
  introInput.placeholder = "New Creation! Now Available on our Website!";
  introInput.setAttribute("data-label", "product-email-intro");

  const hint = document.createElement("p");
  hint.className = "product-email-hint";
  hint.textContent = "Subscribers get the product image, name, price, description and a View Now button linking to its page.";

  checkbox.addEventListener("change", () => {
    fields.hidden = !checkbox.checked;
  });

  checkboxWrapper.append(checkbox, label);
  introField.append(introLabel, introInput);
  fields.append(introField, hint);
  section.append(checkboxWrapper, fields);
  return section;
};

export const buildMailingListSection = async () => {
  const section = document.createElement("div");
  section.className = "mailing-list-section";

  // Add email input
  const addEmailSection = document.createElement("div");
  addEmailSection.className = "add-email-section";

  const addEmailLabel = document.createElement("label");
  addEmailLabel.className = "form-label";
  addEmailLabel.textContent = "Add New Subscriber";
  addEmailLabel.setAttribute("for", "new-subscriber-email");

  const addEmailRow = document.createElement("div");
  addEmailRow.className = "add-email-row";

  const emailInput = document.createElement("input");
  emailInput.className = "form-input";
  emailInput.type = "email";
  emailInput.id = "new-subscriber-email";
  emailInput.name = "new-subscriber-email";
  emailInput.placeholder = "email@example.com";

  const addButton = document.createElement("button");
  addButton.className = "btn btn-add-email";
  addButton.type = "button";
  addButton.textContent = "Add";
  addButton.setAttribute("data-label", "add-subscriber-email");

  addEmailRow.append(emailInput, addButton);
  addEmailSection.append(addEmailLabel, addEmailRow);

  // Subscriber list header (label + refresh button)
  const listHeader = document.createElement("div");
  listHeader.className = "subscriber-list-header";

  const listLabel = document.createElement("label");
  listLabel.className = "form-label subscriber-list-label";
  listLabel.textContent = "Current Subscribers";

  const refreshButton = document.createElement("button");
  refreshButton.className = "btn-admin-refresh";
  refreshButton.type = "button";
  refreshButton.textContent = "↺ Refresh List";
  refreshButton.setAttribute("data-label", "refresh-subscriber-list");

  listHeader.append(listLabel, refreshButton);

  const subscriberList = document.createElement("div");
  subscriberList.className = "subscriber-list";
  subscriberList.id = "subscriber-list";

  // Placeholder for empty state
  const emptyState = document.createElement("div");
  emptyState.className = "subscriber-empty-state";
  emptyState.textContent = "No subscribers yet";
  subscriberList.append(emptyState);

  const subscriberContainer = document.createElement("div");
  subscriberContainer.className = "subscriber-container";
  subscriberContainer.append(listHeader, subscriberList);
  section.append(addEmailSection, subscriberContainer);

  return section;
};

//+++++++++++++++++++++++++++++++++++
