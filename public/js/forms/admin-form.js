export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-dashboard-wrapper";

  const dashboardHeader = await buildDashboardHeader();
  const productsSection = await buildProductsSection();
  const eventsSection = await buildEventsSection();
  const newsletterSection = await buildNewsletterSection();
  const statsSection = await buildStatsSection();

  adminFormWrapper.append(dashboardHeader, productsSection, eventsSection, newsletterSection, statsSection);

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

  header.append(title, subtitle);

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
  section.append(title, actionCards);

  return section;
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
  section.append(title, actionCards);

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
  const editCard = await buildActionCard("edit", "newsletter");

  actionCards.append(writeCard, editCard);
  section.append(title, actionCards);

  return section;
};

export const buildStatsSection = async () => {
  const section = document.createElement("div");
  section.className = "stats-section";

  const stats = [
    { icon: "📦", value: "0", label: "Total Products", id: "total-products-stat" },
    { icon: "👁️", value: "0", label: "Displayed", id: "displayed-products-stat" },
    { icon: "✅", value: "0", label: "Sold", id: "sold-products-stat" },
    { icon: "📅", value: "0", label: "Upcoming Events", id: "upcoming-events-stat" },
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
    icon.textContent = mode === "write" ? "✍️" : "📝";
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
    titleText = mode === "write" ? "Write Newsletter" : "Edit Mailing List";
    descText = mode === "write" ? "Compose and send a newsletter to all subscribers" : "Add or remove email addresses from your mailing list";
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
    titleText = mode === "write" ? "WRITE NEWSLETTER" : "EDIT MAILING LIST";
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
  if (mode === "edit") {
    const selector = entityType === "products" ? await buildAdminProductSelector() : await buildAdminEventSelector();
    body.append(selector);
  }

  if (entityType === "newsletter") {
    if (mode === "write") {
      const subjectField = await buildNewsletterSubject();
      const messageField = await buildNewsletterMessage();
      body.append(subjectField, messageField);
      return body;
    } else if (mode === "edit") {
      const mailingListSection = await buildMailingListSection();
      body.append(mailingListSection);
      return body;
    }
  }

  // Build form fields based on entity type - NEW SECTIONED LAYOUT
  if (entityType === "products") {
    // Section 1: Product Details
    const detailsSection = await buildProductDetailsSection(mode);

    // Section 2: Product Status
    const statusSection = await buildProductStatusSection(mode);

    // Section 3: Shipping Information
    const shippingSection = await buildProductShippingSection(mode);

    // Section 4: Product Image
    const imageSection = await buildProductImageSection(mode);

    body.append(detailsSection, statusSection, shippingSection, imageSection);
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
  if (mode === "edit" && entityType !== "newsletter") {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-admin-delete";
    deleteButton.type = "button";
    deleteButton.id = entityType === "products" ? "delete-product-button" : "delete-event-button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = true;
    deleteButton.setAttribute("data-label", entityType === "products" ? "delete-product-submit" : "delete-event-submit");
    actions.append(deleteButton);
  }

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-admin-cancel";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  // Submit button
  const submitButton = document.createElement("button");
  submitButton.className = "btn btn-admin-submit";
  submitButton.type = "button";

  let submitId;
  let submitLabel;
  let submitText;

  if (entityType === "newsletter") {
    submitId = mode === "write" ? "send-newsletter-button" : "save-mailing-list-button";
    submitLabel = mode === "write" ? "send-newsletter-submit" : "save-mailing-list-submit";
    submitText = mode === "write" ? "Send Newsletter" : "Save Changes";
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

  if (mode === "edit" && entityType !== "newsletter") {
    submitButton.disabled = true;
  }

  actions.append(cancelButton, submitButton);

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

  // Product Name Row
  const nameRow = await buildInfoRow(mode, "name", "Product Name");

  // Type Row
  const typeRow = await buildInfoRowSelect(mode, "product-type", "Type", [
    { value: "acorns", text: "Acorns", selected: true },
    { value: "mountainTreasureBaskets", text: "Mountain Treasure Baskets" },
    { value: "animals", text: "Animals" },
    { value: "geodes", text: "Geodes" },
    { value: "gnomeHouses", text: "Gnome Houses" },
    { value: "wallPieces", text: "Wall Pieces" },
    { value: "other", text: "Other" },
  ]);

  // Price Row
  const priceRow = await buildInfoRow(mode, "price", "Price");

  // Description Row
  const descRow = await buildInfoRowTextarea(mode, "description", "Description");

  section.append(header, nameRow, typeRow, priceRow, descRow);

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
  const displayCard = await buildStatusCard(mode, "display", "Display on Site", "display-card");

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
  const lengthItem = await buildShippingItem(mode, "length", "Length");
  const widthItem = await buildShippingItem(mode, "width", "Width");
  const heightItem = await buildShippingItem(mode, "height", "Height");
  const weightItem = await buildShippingItem(mode, "weight", "Weight");

  col1.append(lengthItem, widthItem);
  col2.append(heightItem, weightItem);

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
  title.textContent = "Product Image";

  header.append(icon, title);

  const uploadSection = await buildAdminUpload(mode, "products");

  section.append(header, uploadSection);

  return section;
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
export const buildShippingItem = async (mode, fieldName, labelText) => {
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
  input.placeholder = "0";

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
  title.textContent = "Event Image";

  header.append(icon, title);

  const uploadSection = await buildAdminUpload(mode, "events");

  section.append(header, uploadSection);

  return section;
};

//-------------------

//PRODUCT FORM FIELDS
export const buildAdminProductSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

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

  // selectorWrapper.append(selectorLabel, productSelect);
  selectorWrapper.append(productSelect);

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

//+++++++++++++++++++

//ADMIN UPLOAD

export const buildAdminUpload = async (mode, entityType = "products") => {
  const uploadSection = document.createElement("div");
  uploadSection.className = "image-upload-area";

  // Image display container
  const imageDisplay = document.createElement("div");
  imageDisplay.className = "image-display";
  imageDisplay.id = mode === "add" ? "current-image-preview" : "edit-current-image-preview";

  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "image-placeholder";
  imagePlaceholder.textContent = "🖼️";

  const currentImage = document.createElement("img");
  currentImage.id = mode === "add" ? "current-image" : "edit-current-image";
  currentImage.className = "current-image";
  currentImage.alt = mode === "add" ? "Selected product image" : "Current product image";
  currentImage.style.display = "none";

  // Delete button for the image
  const deleteImageBtn = document.createElement("button");
  deleteImageBtn.type = "button";
  deleteImageBtn.className = "delete-image-btn";
  deleteImageBtn.id = mode === "add" ? "delete-image-btn" : "edit-delete-image-btn";
  deleteImageBtn.innerHTML = "×";
  deleteImageBtn.title = "Delete image";
  deleteImageBtn.setAttribute("data-label", mode === "add" ? "delete-upload-image" : "edit-delete-upload-image");
  deleteImageBtn.entityType = entityType;
  deleteImageBtn.style.display = "none";

  imageDisplay.append(imagePlaceholder, currentImage, deleteImageBtn);

  // Hidden file input
  const picInput = document.createElement("input");
  picInput.type = "file";
  picInput.id = mode === "add" ? "upload-pic-input" : "edit-upload-pic-input";
  picInput.accept = ".jpg,.jpeg,.png,.gif,.webp";
  picInput.style.display = "none";

  if (mode === "edit") {
    picInput.disabled = true;
  }

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.id = mode === "add" ? "upload-button" : "edit-upload-button";
  uploadButton.className = "upload-btn";
  uploadButton.textContent = mode === "add" ? "Choose Image" : "Change Image";
  uploadButton.setAttribute("data-label", mode === "add" ? "upload-click" : "edit-upload-click");
  uploadButton.entityType = entityType;

  if (mode === "edit") {
    uploadButton.disabled = true;
  }

  const uploadStatus = document.createElement("span");
  uploadStatus.id = mode === "add" ? "upload-status" : "edit-upload-status";
  uploadStatus.className = "upload-status";
  uploadStatus.style.display = "none";

  uploadSection.append(imageDisplay, picInput, uploadButton, uploadStatus);

  return uploadSection;
};

//+++++++++++

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
  messageLabel.setAttribute("for", "newsletter-message");

  const messageInput = document.createElement("textarea");
  messageInput.className = "form-textarea newsletter-textarea";
  messageInput.id = "newsletter-message";
  messageInput.name = "newsletter-message";
  messageInput.placeholder = "Write your newsletter message...";

  messageWrapper.append(messageLabel, messageInput);

  return messageWrapper;
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

  // Subscriber list
  const listLabel = document.createElement("label");
  listLabel.className = "form-label subscriber-list-label";
  listLabel.textContent = "Current Subscribers";

  const subscriberList = document.createElement("div");
  subscriberList.className = "subscriber-list";
  subscriberList.id = "subscriber-list";

  // Placeholder for empty state
  const emptyState = document.createElement("div");
  emptyState.className = "subscriber-empty-state";
  emptyState.textContent = "No subscribers yet";
  subscriberList.append(emptyState);

  section.append(addEmailSection, listLabel, subscriberList);

  return section;
};

//+++++++++++++++++++++++++++++++++++
