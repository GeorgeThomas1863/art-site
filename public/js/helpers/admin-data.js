import { ADMIN_EDIT_DEFAULT_ARRAY } from "../util/define-things.js";

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

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  // Image preview - UPDATED IDs
  if (!picData || !picData.filename) return null;
  const currentImage = document.getElementById("edit-current-image");
  const currentImagePreview = document.getElementById("edit-current-image-preview");
  if (!currentImage || !currentImagePreview) return null;

  currentImage.src = `/pics/${picData.filename}`;
  currentImagePreview.style.display = "flex";
};

export const enableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = false;
    }
  }

  return true;
};

export const disableAdminEditFields = async () => {
  for (let i = 0; i < ADMIN_EDIT_DEFAULT_ARRAY.length; i++) {
    const field = document.getElementById(ADMIN_EDIT_DEFAULT_ARRAY[i]);
    if (field) {
      field.disabled = true;
    }
  }

  return true;
};

export const clearAdminEditFields = async () => {
  const clearFieldsArray = ["edit-name", "edit-price", "edit-description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  const currentImagePreview = document.getElementById("edit-current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  return true;
};

export const clearAdminAddFields = async () => {
  const clearFieldsArray = ["name", "price", "description"];

  for (let i = 0; i < clearFieldsArray.length; i++) {
    const field = document.getElementById(clearFieldsArray[i]);
    if (field) {
      field.value = "";
    }
  }

  // Reset select dropdowns to defaults
  const productTypeSelect = document.getElementById("product-type");
  if (productTypeSelect) {
    productTypeSelect.selectedIndex = 0; // Reset to first option (Acorns)
  }

  const displaySelect = document.getElementById("display");
  if (displaySelect) {
    displaySelect.value = "yes"; // Reset to default
  }

  const soldSelect = document.getElementById("sold");
  if (soldSelect) {
    soldSelect.value = "no"; // Reset to default
  }

  // Clear image preview
  const currentImagePreview = document.getElementById("current-image-preview");
  if (currentImagePreview) {
    currentImagePreview.style.display = "none";
  }

  // Reset upload button and status
  const uploadButton = document.getElementById("upload-button");
  const uploadStatus = document.getElementById("upload-status");
  const uploadInput = document.getElementById("upload-pic-input");

  if (uploadButton) {
    uploadButton.uploadData = null;
    uploadButton.textContent = "Choose Image";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
    uploadStatus.style.display = "none";
  }

  if (uploadInput) {
    uploadInput.value = ""; // Clear the file input
  }

  return true;
};
