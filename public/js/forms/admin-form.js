export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-dashboard-wrapper";

  const dashboardHeader = await buildDashboardHeader();
  const productsSection = await buildProductsSection();
  const eventsSection = await buildEventsSection();
  const statsSection = await buildStatsSection();

  // Modals
  const addProductModal = await buildModal("add", "products");
  const editProductModal = await buildModal("edit", "products");
  const addEventModal = await buildModal("add", "events");
  const editEventModal = await buildModal("edit", "events");

  adminFormWrapper.append(
    dashboardHeader,
    productsSection,
    eventsSection,
    statsSection,
    addProductModal,
    editProductModal,
    addEventModal,
    editEventModal
  );

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

export const buildStatsSection = async () => {
  const section = document.createElement("div");
  section.className = "stats-section";

  const stats = [
    { icon: "📦", value: "0", label: "Total Products", id: "total-products-stat" },
    { icon: "👁️", value: "0", label: "Displayed", id: "displayed-products-stat" },
    { icon: "✅", value: "0", label: "Sold", id: "sold-products-stat" },
    { icon: "📅", value: "0", label: "Upcoming Events", id: "upcoming-events-stat" },
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
  // card.setAttribute("data-modal-trigger", `${mode}-${entityType}`);
  card.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const icon = document.createElement("div");
  icon.className = "action-icon";
  icon.textContent = mode === "add" ? "➕" : "✏️";
  icon.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const title = document.createElement("div");
  title.className = "action-title";
  const entityName = entityType === "products" ? "Product" : "Event";
  title.textContent = mode === "add" ? `Add New ${entityName}` : `Edit ${entityName}`;
  title.setAttribute("data-label", `open-modal-${mode}-${entityType}`);

  const description = document.createElement("div");
  description.className = "action-description";
  description.textContent =
    mode === "add"
      ? `Create a new ${entityName.toLowerCase()} listing with images and details`
      : `Modify or delete existing ${entityName.toLowerCase()}s`;
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

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = await buildModalHeader(mode, entityType);
  const modalBody = await buildModalBody(mode, entityType);
  const modalActions = await buildModalActions(mode, entityType);

  modalContent.append(modalHeader, modalBody, modalActions);
  modalOverlay.append(modalContent);

  return modalOverlay;
};

// Modal Header
export const buildModalHeader = async (mode, entityType) => {
  const header = document.createElement("div");
  header.className = "modal-header";

  const title = document.createElement("h2");
  title.className = "modal-title";
  const entityName = entityType === "products" ? "PRODUCT" : "EVENT";
  title.textContent = mode === "add" ? `ADD NEW ${entityName}` : `EDIT ${entityName}`;

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.textContent = "×";
  closeButton.type = "button";
  // closeButton.setAttribute("data-modal-close", `${mode}-${entityType}-modal`);
  closeButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  header.append(title, closeButton);

  return header;
};

// Modal Body
export const buildModalBody = async (mode, entityType) => {
  const body = document.createElement("div");
  body.className = "modal-body";

  // Add selector for edit mode
  if (mode === "edit") {
    const selector = entityType === "products" ? await buildAdminProductSelector() : await buildAdminEventSelector();
    body.append(selector);
  }

  // Build form fields based on entity type
  if (entityType === "products") {
    const nameField = await buildProductName(mode);
    const typeField = await buildProductType(mode);
    const priceField = await buildProductPrice(mode);
    const descriptionField = await buildProductDescription(mode);
    const dropDownRow = await buildProductDropDownRow(mode);
    const uploadSection = await buildAdminUpload(mode);

    body.append(nameField, typeField, priceField, descriptionField, dropDownRow, uploadSection);
    return body;
  }

  const nameField = await buildEventName(mode);
  const dateField = await buildEventDate(mode);
  const locationField = await buildEventLocation(mode);
  const descriptionField = await buildEventDescription(mode);
  const uploadSection = await buildAdminUpload(mode);

  body.append(nameField, dateField, locationField, descriptionField, uploadSection);

  return body;
};

// Modal Actions
export const buildModalActions = async (mode, entityType) => {
  const actions = document.createElement("div");
  actions.className = "modal-actions";

  // Delete button for edit mode
  if (mode === "edit") {
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-delete";
    deleteButton.type = "button";
    deleteButton.id = entityType === "products" ? "delete-product-button" : "delete-event-button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = true;
    deleteButton.setAttribute("data-label", entityType === "products" ? "delete-product-submit" : "delete-event-submit");
    actions.append(deleteButton);
  }

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-cancel";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  // cancelButton.setAttribute("data-modal-close", `${mode}-${entityType}-modal`);
  cancelButton.setAttribute("data-label", `close-modal-${mode}-${entityType}`);

  // Submit button (ridiculous from claude)
  const submitButton = document.createElement("button");
  submitButton.className = "btn btn-submit";
  submitButton.type = "button";
  submitButton.id =
    mode === "add"
      ? entityType === "products"
        ? "submit-button"
        : "event-submit-button"
      : entityType === "products"
      ? "edit-submit-button"
      : "edit-event-submit-button";
  submitButton.textContent = mode === "add" ? "Submit" : "Update";
  submitButton.setAttribute(
    "data-label",
    mode === "add"
      ? entityType === "products"
        ? "new-product-submit"
        : "new-event-submit"
      : entityType === "products"
      ? "edit-product-submit"
      : "edit-event-submit"
  );

  if (mode === "edit") {
    submitButton.disabled = true;
  }

  actions.append(cancelButton, submitButton);

  return actions;
};

//+++++++++++++++++++++++++++++

//PRODUCT FORM FIELDS
export const buildAdminProductSelector = async () => {
  const selectorWrapper = document.createElement("li");
  selectorWrapper.className = "form-field product-selector-field";

  const selectorLabel = document.createElement("label");
  selectorLabel.className = "form-label";
  selectorLabel.textContent = "Select Product to Edit";
  selectorLabel.setAttribute("for", "product-selector");

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

  selectorWrapper.append(selectorLabel, productSelect);

  return selectorWrapper;
};

export const buildProductName = async (mode) => {
  const nameWrapper = document.createElement("li");
  nameWrapper.className = "form-field";

  const nameLabel = document.createElement("label");
  nameLabel.className = "form-label";
  nameLabel.textContent = "Product Name";
  nameLabel.setAttribute("for", mode === "add" ? "name" : "edit-name");

  const nameInput = document.createElement("input");
  nameInput.className = "form-input";
  nameInput.type = "text";
  nameInput.id = mode === "add" ? "name" : "edit-name";
  nameInput.name = mode === "add" ? "name" : "edit-name";

  if (mode === "edit") {
    nameInput.disabled = true;
  }

  nameWrapper.append(nameLabel, nameInput);

  return nameWrapper;
};

export const buildProductType = async (mode) => {
  const adminProductType = document.createElement("div");
  adminProductType.className = "form-field";

  const productTypeLabel = document.createElement("label");
  productTypeLabel.className = "form-label";
  productTypeLabel.textContent = "Type";
  productTypeLabel.setAttribute("for", mode === "add" ? "product-type" : "edit-product-type");

  const productTypeSelect = document.createElement("select");
  productTypeSelect.className = "form-select";
  productTypeSelect.id = mode === "add" ? "product-type" : "edit-product-type";

  if (mode === "edit") {
    productTypeSelect.disabled = true;
  }

  const optionArray = [
    { value: "acorns", text: "Acorns", selected: true },
    { value: "mountainTreasureBaskets", text: "Mountain Treasure Baskets" },
    { value: "animals", text: "Animals" },
    { value: "geodes", text: "Geodes" },
    { value: "gnomeHouses", text: "Gnome Houses" },
    { value: "wallPieces", text: "Wall Pieces" },
    { value: "other", text: "Other" },
  ];

  for (let i = 0; i < optionArray.length; i++) {
    const optionData = optionArray[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    productTypeSelect.append(option);
  }

  adminProductType.append(productTypeLabel, productTypeSelect);

  return adminProductType;
};

export const buildProductPrice = async (mode) => {
  const priceWrapper = document.createElement("div");
  priceWrapper.className = "form-field";

  const priceLabel = document.createElement("label");
  priceLabel.className = "form-label";
  priceLabel.textContent = "Price";
  priceLabel.setAttribute("for", mode === "add" ? "price" : "edit-price");

  const priceInput = document.createElement("input");
  priceInput.className = "form-input";
  priceInput.type = "text";
  priceInput.id = mode === "add" ? "price" : "edit-price";
  priceInput.name = mode === "add" ? "price" : "edit-price";

  if (mode === "edit") {
    priceInput.disabled = true;
  }

  priceWrapper.append(priceLabel, priceInput);

  return priceWrapper;
};

export const buildProductDescription = async (mode) => {
  const descWrapper = document.createElement("div");
  descWrapper.className = "form-field";

  const descLabel = document.createElement("label");
  descLabel.className = "form-label";
  descLabel.textContent = "Description";
  descLabel.setAttribute("for", mode === "add" ? "description" : "edit-description");

  const descInput = document.createElement("textarea");
  descInput.className = "form-textarea";
  descInput.id = mode === "add" ? "description" : "edit-description";
  descInput.name = mode === "add" ? "description" : "edit-description";

  if (mode === "edit") {
    descInput.disabled = true;
  }

  descWrapper.append(descLabel, descInput);

  return descWrapper;
};

export const buildProductDropDownRow = async (mode) => {
  const dropDownRow = document.createElement("div");
  dropDownRow.className = "form-row";

  const adminDisplayToggle = await buildProductDisplayToggle(mode);
  const adminSoldToggle = await buildProductSoldToggle(mode);

  dropDownRow.append(adminDisplayToggle, adminSoldToggle);

  return dropDownRow;
};

export const buildProductDisplayToggle = async (mode) => {
  // Display select
  const displayToggle = document.createElement("div");
  displayToggle.className = "drop-down-half";

  const displayLabel = document.createElement("label");
  displayLabel.className = "form-label";
  displayLabel.textContent = "Display on Site?";
  displayLabel.setAttribute("for", mode === "add" ? "display" : "edit-display");

  const displaySelect = document.createElement("select");
  displaySelect.className = "form-select";
  displaySelect.id = mode === "add" ? "display" : "edit-display";
  displaySelect.name = mode === "add" ? "display" : "edit-display";

  if (mode === "edit") {
    displaySelect.disabled = true;
  }

  const displayOptions = [
    { value: "yes", text: "Yes", selected: true },
    { value: "no", text: "No" },
  ];

  for (let i = 0; i < displayOptions.length; i++) {
    const optionData = displayOptions[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    displaySelect.append(option);
  }

  displayToggle.append(displayLabel, displaySelect);

  return displayToggle;
};

export const buildProductSoldToggle = async (mode) => {
  // Sold select
  const soldToggle = document.createElement("div");
  soldToggle.className = "drop-down-half";

  const soldLabel = document.createElement("label");
  soldLabel.className = "form-label";
  soldLabel.textContent = "Sold?";
  soldLabel.setAttribute("for", mode === "add" ? "sold" : "edit-sold");

  const soldSelect = document.createElement("select");
  soldSelect.className = "form-select";
  soldSelect.id = mode === "add" ? "sold" : "edit-sold";
  soldSelect.name = mode === "add" ? "sold" : "edit-sold";

  if (mode === "edit") {
    soldSelect.disabled = true;
  }

  const soldOptions = [
    { value: "yes", text: "Yes" },
    { value: "no", text: "No", selected: true },
  ];

  for (let i = 0; i < soldOptions.length; i++) {
    const optionData = soldOptions[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    soldSelect.append(option);
  }

  soldToggle.append(soldLabel, soldSelect);

  return soldToggle;
};

//+++++++++++++++++++

//EVENT FORM FIELDS

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

export const buildEventName = async (mode) => {
  const nameWrapper = document.createElement("div");
  nameWrapper.className = "form-field";

  const nameLabel = document.createElement("label");
  nameLabel.className = "form-label";
  nameLabel.textContent = "Event Name";
  nameLabel.setAttribute("for", mode === "add" ? "name" : "edit-name");

  const nameInput = document.createElement("input");
  nameInput.className = "form-input";
  nameInput.type = "text";
  nameInput.id = mode === "add" ? "name" : "edit-name";
  nameInput.name = mode === "add" ? "name" : "edit-name";

  if (mode === "edit") {
    nameInput.disabled = true;
  }

  nameWrapper.append(nameLabel, nameInput);

  return nameWrapper;
};

export const buildEventDate = async (mode) => {
  const dateWrapper = document.createElement("li");
  dateWrapper.className = "form-field";

  const dateLabel = document.createElement("label");
  dateLabel.className = "form-label";
  dateLabel.id = mode === "add" ? "event-date-label" : "edit-event-date-label";
  dateLabel.textContent = "Event Date";
  dateLabel.setAttribute("for", mode === "add" ? "event-date" : "edit-event-date");

  const dateInput = document.createElement("input");
  dateInput.className = "form-input";
  dateInput.type = "date";
  dateInput.id = mode === "add" ? "event-date" : "edit-event-date";
  dateInput.name = mode === "add" ? "event-date" : "edit-event-date";

  if (mode === "edit") dateInput.disabled = true;

  dateWrapper.append(dateLabel, dateInput);

  return dateWrapper;
};

export const buildEventLocation = async (mode) => {
  const locationWrapper = document.createElement("li");
  locationWrapper.className = "form-field";

  const locationLabel = document.createElement("label");
  locationLabel.className = "form-label";
  locationLabel.id = mode === "add" ? "event-location-label" : "edit-event-location-label";
  locationLabel.textContent = "Location";
  locationLabel.setAttribute("for", mode === "add" ? "event-location" : "edit-event-location");

  const locationInput = document.createElement("input");
  locationInput.className = "form-input";
  locationInput.type = "text";
  locationInput.id = mode === "add" ? "event-location" : "edit-event-location";
  locationInput.name = mode === "add" ? "event-location" : "edit-event-location";

  if (mode === "edit") locationInput.disabled = true;

  locationWrapper.append(locationLabel, locationInput);

  return locationWrapper;
};

export const buildEventDescription = async (mode) => {
  const descWrapper = document.createElement("li");
  descWrapper.className = "form-field";

  const descLabel = document.createElement("label");
  descLabel.className = "form-label";
  descLabel.id = mode === "add" ? "event-description-label" : "edit-event-description-label";
  descLabel.textContent = "Description";
  descLabel.setAttribute("for", mode === "add" ? "event-description" : "edit-event-description");

  const descInput = document.createElement("textarea");
  descInput.className = "form-textarea";
  descInput.id = mode === "add" ? "event-description" : "edit-event-description";
  descInput.name = mode === "add" ? "event-description" : "edit-event-description";

  if (mode === "edit") descInput.disabled = true;

  descWrapper.append(descLabel, descInput);

  return descWrapper;
};

//++++++++++++

//ADMIN UPLOAD

export const buildAdminUpload = async (mode) => {
  const uploadSection = document.createElement("div");
  uploadSection.className = "upload-section";

  // Current image preview
  const currentImagePreview = document.createElement("div");
  currentImagePreview.className = "current-image-preview";
  currentImagePreview.id = mode === "add" ? "current-image-preview" : "edit-current-image-preview";
  currentImagePreview.style.display = "none";

  const currentImageLabel = document.createElement("span");
  currentImageLabel.className = "current-image-label";
  currentImageLabel.textContent = mode === "add" ? "Selected Image:" : "Current Image:";

  const currentImage = document.createElement("img");
  currentImage.id = mode === "add" ? "current-image" : "edit-current-image";
  currentImage.className = "current-image";
  currentImage.alt = mode === "add" ? "Selected product image" : "Current product image";

  currentImagePreview.append(currentImageLabel, currentImage);
  uploadSection.append(currentImagePreview);

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

  if (mode === "edit") {
    uploadButton.disabled = true;
  }

  const uploadStatus = document.createElement("span");
  uploadStatus.id = mode === "add" ? "upload-status" : "edit-upload-status";
  uploadStatus.className = "upload-status";
  uploadStatus.style.marginLeft = "10px";
  uploadStatus.style.display = "none";

  uploadSection.append(picInput, uploadButton, uploadStatus);

  return uploadSection;
};

//===================================

// export const buildEntitySelector = async () => {
//   const selectorBar = document.createElement("div");
//   selectorBar.className = "entity-selector-bar";

//   const selectorLabel = document.createElement("label");
//   selectorLabel.className = "entity-selector-label";
//   selectorLabel.textContent = "Managing:";
//   selectorLabel.setAttribute("for", "entity-type-selector");

//   const selectorDropdown = document.createElement("select");
//   selectorDropdown.className = "entity-selector-dropdown";
//   selectorDropdown.id = "entity-type-selector";
//   selectorDropdown.name = "entity-type-selector";

//   const productOption = document.createElement("option");
//   productOption.value = "products";
//   productOption.textContent = "Products";
//   productOption.selected = true;

//   const eventOption = document.createElement("option");
//   eventOption.value = "events";
//   eventOption.textContent = "Events";

//   selectorDropdown.append(productOption, eventOption);
//   selectorBar.append(selectorLabel, selectorDropdown);

//   return selectorBar;
// };

//navigation buttons at top
// export const buildTabNav = async () => {
//   const tabContainer = document.createElement("div");
//   tabContainer.className = "admin-tab-container";

//   const tabWrapper = document.createElement("div");
//   tabWrapper.className = "admin-tab-wrapper";

//   // Add Product Tab Button
//   const addTabButton = document.createElement("button");
//   addTabButton.className = "admin-tab-button active";
//   addTabButton.id = "add-tab-button";
//   addTabButton.textContent = "Add Product";
//   addTabButton.setAttribute("data-tab", "add");

//   // Edit Product Tab Button
//   const editTabButton = document.createElement("button");
//   editTabButton.className = "admin-tab-button";
//   editTabButton.id = "edit-tab-button";
//   editTabButton.textContent = "Edit Product";
//   editTabButton.setAttribute("data-tab", "edit");

//   tabWrapper.append(addTabButton, editTabButton);
//   tabContainer.append(tabWrapper);

//   return tabContainer;
// };

// export const buildAdminTab = async (mode = "add") => {
//   const tabWrapper = document.createElement("ul");
//   tabWrapper.id = mode === "add" ? "add-tab" : "edit-tab";
//   tabWrapper.className = "admin-tab active";

//   const tabTitle = await buildTabTitle(mode);
//   tabWrapper.append(tabTitle);

//   // Hide edit form by default
//   if (mode === "edit") {
//     tabWrapper.style.display = "none";
//     const adminProductSelector = await buildAdminProductSelector();
//     tabWrapper.append(adminProductSelector);
//   }

//   const adminName = await buildName(mode);
//   const productType = await buildProductType(mode);
//   const formInputList = await buildFormInputList(mode); // price and description
//   const dropDownRow = await buildDropDownRow(mode); // display and sold toggles
//   const adminUpload = await buildAdminUpload(mode);
//   // const deleteButton = mode === "edit" ? await buildDeleteButton() : null;
//   const adminSubmit = await buildAdminSubmit(mode);

//   tabWrapper.append(adminName, productType, formInputList, dropDownRow, adminUpload, adminSubmit);

//   return tabWrapper;
// };

// export const buildTabTitle = async (mode) => {
//   const titleWrapper = document.createElement("div");
//   titleWrapper.className = "admin-tab-title-wrapper";

//   const tabTitle = document.createElement("h1");
//   tabTitle.className = "admin-tab-title";
//   tabTitle.textContent = mode === "add" ? "Add New Product" : "Edit Product";

//   titleWrapper.append(tabTitle);
//   if (mode !== "edit") return titleWrapper;

//   const deleteButton = document.createElement("button");
//   deleteButton.type = "button";
//   deleteButton.className = "delete-btn-header";
//   deleteButton.id = "delete-product-button";
//   deleteButton.textContent = "Delete Product";
//   deleteButton.setAttribute("data-label", "delete-product-submit");
//   deleteButton.style.display = "none"; // Hidden by default

//   titleWrapper.append(deleteButton);

//   return titleWrapper;
// };

// export const buildFormInputList = async (mode) => {
//   // Create fields containe
//   const adminFormInputList = document.createElement("ul");
//   adminFormInputList.className = "admin-form-input-list";

//   // Form fields configuration
//   const fields = [
//     { name: "price", label: "Price", type: "text", required: true },
//     { name: "description", label: "Description", type: "textarea" },
//   ];

//   // Create each form field
//   for (let i = 0; i < fields.length; i++) {
//     const field = fields[i];
//     const fieldWrapper = document.createElement("li");
//     fieldWrapper.className = "form-field";

//     const fieldId = mode === "edit" ? `edit-${field.name}` : field.name;

//     const label = document.createElement("label");
//     label.className = "form-label";
//     label.textContent = field.label;
//     label.setAttribute("for", fieldId);

//     let input;
//     if (field.type === "textarea") {
//       input = document.createElement("textarea");
//       input.className = "form-textarea";
//     } else {
//       input = document.createElement("input");
//       input.className = "form-input";
//       input.type = field.type;
//     }

//     input.id = fieldId;
//     input.name = fieldId;

//     if (mode === "edit") {
//       input.disabled = true;
//     }

//     fieldWrapper.append(label, input);
//     adminFormInputList.append(fieldWrapper);
//   }

//   return adminFormInputList;
// };

// export const buildDropDownRow = async (mode) => {
//   const dropDownRow = document.createElement("li");
//   dropDownRow.className = "drop-down-row";

//   const adminDisplayToggle = await buildDisplayToggle(mode);
//   const adminSoldToggle = await buildSoldToggle(mode);

//   dropDownRow.append(adminDisplayToggle, adminSoldToggle);

//   return dropDownRow;
// };

// export const buildAdminSubmit = async (mode) => {
//   const submitButton = document.createElement("button");
//   submitButton.type = "submit";
//   submitButton.className = "submit-btn";
//   submitButton.id = mode === "add" ? "submit-button" : "edit-submit-button";
//   submitButton.textContent = mode === "add" ? "Submit" : "Update";
//   submitButton.setAttribute("data-label", mode === "add" ? "new-product-submit" : "edit-product-submit");

//   if (mode === "edit") {
//     submitButton.disabled = true;
//   }

//   return submitButton;
// };
