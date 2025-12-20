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
