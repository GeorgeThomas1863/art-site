export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("div");
  adminFormWrapper.className = "admin-form-wrapper";

  const addTab = await buildAdminTab("add");
  const editTab = await buildAdminTab("edit");
  adminFormWrapper.append(addTab, editTab);

  return adminFormWrapper;
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
    const productSelector = await buildProductSelector();
    tabWrapper.append(productSelector);
  }

  const adminName = await buildAdminName(mode);
  const productTypeField = await buildAdminProductType(mode);
  const formInput = await buildFormInput(mode); // price and description
  const dropDownRow = await buildDropDownRow(mode); // display and sold toggles
  const uploadSection = await buildUploadSection(mode);
  // const deleteButton = mode === "edit" ? await buildDeleteButton() : null;
  const submitButton = await buildSubmitButton(mode);

  tabWrapper.append(adminName, productTypeField, formInput, dropDownRow, uploadSection, submitButton);

  // Append elements based on mode

  return tabWrapper;
};

export const buildTabTitle = async (mode) => {
  const tabTitle = document.createElement("h1");
  tabTitle.className = "admin-tab-title";
  tabTitle.textContent = mode === "add" ? "Add New Product" : "Edit Product";

  return tabTitle;
};

export const buildProductSelector = async () => {
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

export const buildAdminName = async (mode) => {
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

export const buildAdminProductType = async (mode) => {
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

export const buildAdminFormInput = async () => {
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

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = field.label;
    label.setAttribute("for", field.name);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "form-textarea";
    } else {
      input = document.createElement("input");
      input.className = "form-input";
      input.type = field.type;
    }

    input.id = field.name;
    input.name = field.name;

    fieldWrapper.append(label, input);
    adminFormInputList.append(fieldWrapper);
  }

  return adminFormInputList;
};
//-----------------------

export const buildAdminDropDownRow = async () => {
  const dropDownRow = document.createElement("li");
  dropDownRow.className = "drop-down-row";

  const adminDisplayToggle = await buildAdminDisplayToggle();
  const adminSoldToggle = await buildAdminSoldToggle();

  dropDownRow.append(adminDisplayToggle, adminSoldToggle);

  return dropDownRow;
};

export const buildAdminDisplayToggle = async () => {
  // Display select
  const displayToggle = document.createElement("div");
  displayToggle.className = "drop-down-half";

  const displayLabel = document.createElement("label");
  displayLabel.className = "form-label";
  displayLabel.textContent = "Display on Site?";
  displayLabel.setAttribute("for", "display");

  const displaySelect = document.createElement("select");
  displaySelect.className = "form-select";
  displaySelect.id = "display";
  displaySelect.name = "display";

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

export const buildAdminSoldToggle = async () => {
  // Sold select
  const soldToggle = document.createElement("div");
  soldToggle.className = "drop-down-half";

  const soldLabel = document.createElement("label");
  soldLabel.className = "form-label";
  soldLabel.textContent = "Sold?";
  soldLabel.setAttribute("for", "sold");

  const soldSelect = document.createElement("select");
  soldSelect.className = "form-select";
  soldSelect.id = "sold";
  soldSelect.name = "sold";

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

export const buildAdminUpload = async () => {
  const uploadSection = document.createElement("div");
  uploadSection.className = "upload-section";

  const uploadLabel = document.createElement("label");
  uploadLabel.className = "upload-label";
  uploadLabel.textContent = "Image";

  // Hidden for pic upload
  const picInput = document.createElement("input");
  picInput.type = "file";
  picInput.id = "upload-pic-input";
  picInput.accept = ".jpg,.jpeg,.png,.gif,.webp";
  picInput.style.display = "none";

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.id = "upload-button";
  uploadButton.className = "upload-btn";
  uploadButton.textContent = "Choose Image";
  uploadButton.setAttribute("data-label", "upload-click");

  const uploadStatus = document.createElement("span");
  uploadStatus.id = "upload-status";
  uploadStatus.className = "upload-status";
  uploadStatus.style.marginLeft = "10px";
  uploadStatus.style.display = "none";

  uploadSection.append(uploadLabel, picInput, uploadButton, uploadStatus);

  return uploadSection;
};

export const buildAdminSubmit = async () => {
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "submit-btn";
  submitButton.textContent = "Submit";
  submitButton.setAttribute("data-label", "new-product-submit");

  return submitButton;
};
