import { buildAdminForm } from "./forms/admin-form.js";

const adminElement = document.getElementById("admin-element");

export const buildAdminDisplay = async () => {
  if (!adminElement) return null;
  // const { isFirstLoad } = stateAdmin;

  const adminFormData = await buildAdminForm();
  adminElement.append(adminFormData);

  return true;
};

//-------------------------

//ADMIN DATA FUNCTIONS

export const populateAdminProductSelector = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  const productSelector = document.getElementById("product-selector");
  if (!productSelector) return;

  // Clear existing options except the default one
  const defaultOption = productSelector.querySelector("option[disabled]");
  productSelector.innerHTML = "";
  if (defaultOption) {
    productSelector.append(defaultOption);
  }

  // Add all products as options
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    option.textContent = `${product.name} - ${product.productType}`;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    // User selected the default "-- Select a product --" option
    await clearAdminEditFields();
    await disableAdminEditFields();
    return null;
  }

  // Get product data directly from the property
  const productObj = selectedOption.productData;
  if (!productObj) return null;

  // Enable all fields
  await enableAdminEditFields();

  // Populate the form
  await populateAdminEditForm(productObj);
};

export const populateAdminEditForm = async (inputObj) => {
  if (!inputObj) return null;
  const { name, productType, price, description, display, sold, picData } = inputObj;

  const adminEditFieldsArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
  ];

  for (let i = 0; i < adminEditFieldsArray.length; i++) {
    const field = document.getElementById(adminEditFieldsArray[i].id);
    if (field) {
      field.value = adminEditFieldsArray[i].value || "";
    }
  }

  // Image preview
  if (!picData || !picData.filename) return null;
  const currentImage = document.getElementById("current-image");
  const currentImagePreview = document.getElementById("current-image-preview");
  if (!currentImage || !currentImagePreview) return null;

  currentImage.src = `/pics/${picData.filename}`;
  currentImagePreview.style.display = "flex";
};

export const enableAdminEditFields = async () => {
  const adminEditFieldsArray = [
    "edit-name",
    "edit-product-type",
    "edit-price",
    "edit-description",
    "edit-display",
    "edit-sold",
    "edit-upload-pic-input",
    "edit-upload-button",
    "edit-submit-button",
  ];

  for (let i = 0; i < adminEditFieldsArray.length; i++) {
    const field = document.getElementById(adminEditFieldsArray[i]);
    if (field) {
      field.disabled = false;
    }
  }

  return true;
};

export const disableAdminEditFields = async () => {
  const adminEditFieldsArray = [
    "edit-name",
    "edit-product-type",
    "edit-price",
    "edit-description",
    "edit-display",
    "edit-sold",
    "edit-upload-pic-input",
    "edit-upload-button",
    "edit-submit-button",
  ];

  for (let i = 0; i < adminEditFieldsArray.length; i++) {
    const field = document.getElementById(adminEditFieldsArray[i]);
    if (field) {
      field.disabled = true;
    }
  }
};

// 6. Clear the edit form
export const clearAdminEditFields = async () => {
  const adminEditFieldsArray = ["edit-name", "edit-price", "edit-description"];

  for (let i = 0; i < adminEditFieldsArray.length; i++) {
    const field = document.getElementById(adminEditFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  const currentImagePreview = document.getElementById("current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }
};

buildAdminDisplay();
