export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-form-wrapper";

  const tabNav = await buildTabNav();
  const addTab = await buildAdminTab("add");
  const editTab = await buildAdminTab("edit");
  adminFormWrapper.append(tabNav, addTab, editTab);

  return adminFormWrapper;
};

//navigation buttons at top
export const buildTabNav = async () => {
  const tabContainer = document.createElement("div");
  tabContainer.className = "admin-tab-container";

  const tabWrapper = document.createElement("div");
  tabWrapper.className = "admin-tab-wrapper";

  // Add Product Tab Button
  const addTabButton = document.createElement("button");
  addTabButton.className = "admin-tab-button active";
  addTabButton.id = "add-tab-button";
  addTabButton.textContent = "Add Product";
  addTabButton.setAttribute("data-tab", "add");

  // Edit Product Tab Button
  const editTabButton = document.createElement("button");
  editTabButton.className = "admin-tab-button";
  editTabButton.id = "edit-tab-button";
  editTabButton.textContent = "Edit Product";
  editTabButton.setAttribute("data-tab", "edit");

  tabWrapper.append(addTabButton, editTabButton);
  tabContainer.append(tabWrapper);

  return tabContainer;
};

export const buildAdminTab = async (mode = "add") => {
  const tabWrapper = document.createElement("ul");
  tabWrapper.id = mode === "add" ? "add-tab" : "edit-tab";
  tabWrapper.className = "admin-tab active";

  const tabTitle = await buildTabTitle(mode);
  tabWrapper.append(tabTitle);

  // Hide edit form by default
  if (mode === "edit") {
    tabWrapper.style.display = "none";
    const adminProductSelector = await buildAdminProductSelector();
    tabWrapper.append(adminProductSelector);
  }

  const adminName = await buildName(mode);
  const productType = await buildProductType(mode);
  const formInputList = await buildFormInputList(mode); // price and description
  const dropDownRow = await buildDropDownRow(mode); // display and sold toggles
  const adminUpload = await buildAdminUpload(mode);
  // const deleteButton = mode === "edit" ? await buildDeleteButton() : null;
  const adminSubmit = await buildAdminSubmit(mode);

  tabWrapper.append(adminName, productType, formInputList, dropDownRow, adminUpload, adminSubmit);

  return tabWrapper;
};

export const buildTabTitle = async (mode) => {
  const tabTitle = document.createElement("h1");
  tabTitle.className = "admin-tab-title";
  tabTitle.textContent = mode === "add" ? "Add New Product" : "Edit Product";

  return tabTitle;
};

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

export const buildName = async (mode) => {
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

//------------------

export const buildFormInputList = async (mode) => {
  // Create fields containe
  const adminFormInputList = document.createElement("ul");
  adminFormInputList.className = "admin-form-input-list";

  // Form fields configuration
  const fields = [
    { name: "price", label: "Price", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  // Create each form field
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldWrapper = document.createElement("li");
    fieldWrapper.className = "form-field";

    const fieldId = mode === "edit" ? `edit-${field.name}` : field.name;

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = field.label;
    label.setAttribute("for", fieldId);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "form-textarea";
    } else {
      input = document.createElement("input");
      input.className = "form-input";
      input.type = field.type;
    }

    input.id = fieldId;
    input.name = fieldId;

    if (mode === "edit") {
      input.disabled = true;
    }

    fieldWrapper.append(label, input);
    adminFormInputList.append(fieldWrapper);
  }

  return adminFormInputList;
};
//-----------------------

export const buildDropDownRow = async (mode) => {
  const dropDownRow = document.createElement("li");
  dropDownRow.className = "drop-down-row";

  const adminDisplayToggle = await buildDisplayToggle(mode);
  const adminSoldToggle = await buildSoldToggle(mode);

  dropDownRow.append(adminDisplayToggle, adminSoldToggle);

  return dropDownRow;
};

export const buildDisplayToggle = async (mode) => {
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

export const buildSoldToggle = async (mode) => {
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

//---------------------

export const buildAdminUpload = async (mode) => {
  const uploadSection = document.createElement("div");
  uploadSection.className = "upload-section";

  const uploadLabel = document.createElement("label");
  uploadLabel.className = "upload-label";
  uploadLabel.textContent = mode === "add" ? "Image" : "Change Image";
  uploadSection.append(uploadLabel);

  // Current image preview - NOW ENABLED FOR BOTH MODES
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
  uploadButton.textContent = mode === "add" ? "Choose Image" : "";
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

export const buildAdminSubmit = async (mode) => {
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "submit-btn";
  submitButton.id = mode === "add" ? "submit-button" : "edit-submit-button";
  submitButton.textContent = mode === "add" ? "Submit" : "Update";
  submitButton.setAttribute("data-label", mode === "add" ? "new-product-submit" : "edit-product-submit");

  if (mode === "edit") {
    submitButton.disabled = true;
  }

  return submitButton;
};
