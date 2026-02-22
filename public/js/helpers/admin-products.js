import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateProductStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildPicSlot } from "../forms/admin-form.js";

//Add product
export const runAddNewProduct = async () => {
  const newProductParams = await buildNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  // check if at least one image uploaded
  const slotBtns = document.querySelectorAll(".pic-slots-container .upload-btn");
  let hasImage = false;
  for (let i = 0; i < slotBtns.length; i++) {
    if (slotBtns[i].uploadData) { hasImage = true; break; }
  }
  if (!hasImage) {
    await displayPopup("Please upload at least one image of the product", "error");
    return null;
  }

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  // console.log("DATA");
  // console.dir(data);

  const popupText = `Product "${data.name}" added successfully`;
  await displayPopup(popupText, "success");

  // Remove modal
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  // Clear the form after successful submission
  // await clearAdminAddFields();
  // closeModal("add-products-modal");

  // Refresh stats
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) await updateProductStats(productData);

  return data;
};

//----

//Edit product
export const runEditProduct = async () => {
  // Need to get the selected product ID first
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to update", "error");
    return null;
  }
  const editProductParams = await getEditProductParams();
  if (!editProductParams || !editProductParams.name || !editProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  const productId = selectedOption.value;
  editProductParams.productId = productId;
  editProductParams.route = "/edit-product-route";
  // console.log("UPDATE PRODUCT PARAMS");
  // console.dir(editProductParams);

  const data = await sendToBack(editProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to update product", "error");
    return null;
  }

  const popupText = `Product "${data.name}" updated successfully`;
  await displayPopup(popupText, "success");

  // Refresh the product data to reflect changes
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    await populateAdminProductSelector(productData);
    await updateProductStats(productData);

    // Re-select the product that was just updated so user can see the changes
    productSelector.value = productId;

    // Re-populate the form with the updated data
    const updatedOption = productSelector.options[productSelector.selectedIndex];
    if (updatedOption && updatedOption.productData) {
      await populateEditFormProducts(updatedOption.productData);
    }
  }

  return data;
};

export const runDeleteProduct = async () => {
  const productSelector = document.getElementById("product-selector");
  const selectedOption = productSelector.options[productSelector.selectedIndex];

  if (!selectedOption || !selectedOption.value) {
    await displayPopup("Please select a product to delete", "error");
    return null;
  }

  const productName = document.getElementById("edit-name").value;
  const confirmMessage = `Are you sure you want to delete ${productName}? This action cannot be undone.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);

  if (!confirmDialog) return null;

  const productId = selectedOption.value;

  const data = await sendToBack({ route: "/delete-product-route", productId: productId });
  if (!data || !data.success) {
    await displayPopup("Failed to delete product", "error");
    return null;
  }

  const popupText = `Product "${productName}" deleted successfully`;
  await displayPopup(popupText, "success");

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  // Refresh the product data to reflect changes
  const productData = await sendToBack({ route: "/get-product-data-route" }, "GET");
  if (productData) {
    // await populateAdminProductSelector(productData);
    await updateProductStats(productData);
  }

  // // Clear the form fields
  // await clearAdminEditFields();
  // await disableAdminEditFields();
  // productSelector.value = "";

  return data;
};

export const runAddPicSlot = async () => {
  const container = document.querySelector(".pic-slots-container");
  if (!container) return null;

  const existingSlots = container.querySelectorAll(".pic-slot");
  const lastSlot = existingSlots[existingSlots.length - 1];
  const lastHasImage = !!(lastSlot && lastSlot.querySelector(".upload-btn")?.uploadData);

  const index = container.children.length;
  const slot = buildPicSlot(index);
  container.append(slot);

  if (lastHasImage) {
    slot.querySelector(".pic-file-input").click();
  }
};

export const runRemovePicSlot = async (removeBtn) => {
  if (!removeBtn) return null;
  const slot = removeBtn.closest(".pic-slot");
  if (!slot) return null;

  const uploadBtn = slot.querySelector(".upload-btn");
  const filename = uploadBtn?.uploadData?.filename;

  if (filename) {
    await sendToBack({ route: "/delete-pic-route", filename: filename });
  }

  slot.remove();
};

//++++++++++++++++++

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  await clearAdminEditFields();

  // Reset product image slots to a single disabled empty slot
  const container = document.querySelector(".pic-slots-container");
  if (container) {
    container.innerHTML = "";
    const emptySlot = buildPicSlot(0);
    const slotUploadBtn = emptySlot.querySelector(".upload-btn");
    const slotFileInput = emptySlot.querySelector(".pic-file-input");
    if (slotUploadBtn) slotUploadBtn.disabled = true;
    if (slotFileInput) slotFileInput.disabled = true;
    container.append(emptySlot);
  }
  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = true;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption.value) {
    // User selected the default "-- Select a product --" option
    await disableAdminEditFields();
    return null;
  }

  // Get product data directly from the property
  const productObj = selectedOption.productData;
  if (!productObj) return null;

  // Enable all fields
  await enableAdminEditFields();
  await populateEditFormProducts(productObj);
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA
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

  // Sort by most recently added first
  inputArray.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  // Add all products as options
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const option = document.createElement("option");
    option.value = product.productId;
    option.textContent = `${product.name}`;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

export const populateEditFormProducts = async (inputObj) => {
  if (!inputObj) return null;

  const { name, productType, price, description, display, sold, removeWhenSold, picData, canShip, length, width, height, weight } = inputObj;

  const adminEditMapArray = [
    { id: "edit-name", value: name },
    { id: "edit-product-type", value: productType },
    { id: "edit-price", value: price },
    { id: "edit-can-ship", value: canShip || "yes" },
    { id: "edit-length", value: length || 5 },
    { id: "edit-width", value: width || 5 },
    { id: "edit-height", value: height || 5 },
    { id: "edit-weight", value: weight || 5 },
    { id: "edit-description", value: description },
    { id: "edit-display", value: display },
    { id: "edit-sold", value: sold },
    { id: "edit-remove-when-sold", value: removeWhenSold || "yes" },
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  // Sync CSS classes on status selects to match their values
  const statusIds = ["edit-display", "edit-sold", "edit-can-ship", "edit-remove-when-sold"];
  for (const id of statusIds) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("status-yes", "status-no");
      el.classList.add(`status-${el.value}`);
    }
  }

  // Enforce cross-flag invariant on legacy data
  const soldEl = document.getElementById("edit-sold");
  const removeEl = document.getElementById("edit-remove-when-sold");
  const displayEl = document.getElementById("edit-display");

  if (soldEl?.value === "yes" && removeEl?.value === "yes" && displayEl) {
    displayEl.value = "no";
    displayEl.classList.remove("status-yes", "status-no");
    displayEl.classList.add("status-no");
  }

  // Show N/A in shipping fields when can-ship is "no"
  const canShipEl = document.getElementById("edit-can-ship");
  if (canShipEl?.value === "no") {
    const shippingIds = ["edit-length", "edit-width", "edit-height", "edit-weight"];
    for (const id of shippingIds) {
      const input = document.getElementById(id);
      if (input) {
        input.value = "N/A";
        input.disabled = true;
      }
    }
  }

  const deleteButton = document.getElementById("delete-product-button");
  if (deleteButton) {
    deleteButton.disabled = false;
  }

  // Rebuild image slots
  const pics = picData ? (Array.isArray(picData) ? picData : [picData]) : [];
  const slotsContainer = document.querySelector(".pic-slots-container");
  if (!slotsContainer) return null;

  slotsContainer.innerHTML = "";
  for (let i = 0; i < pics.length; i++) {
    const slot = buildPicSlot(i);
    const slotUploadBtn = slot.querySelector(".upload-btn");
    const slotCurrentImage = slot.querySelector(".current-image");
    const slotPlaceholder = slot.querySelector(".image-placeholder");
    const slotDeleteBtn = slot.querySelector(".delete-image-btn");

    if (slotUploadBtn) {
      slotUploadBtn.uploadData = pics[i];
      slotUploadBtn.textContent = "Change Image";
    }
    if (slotCurrentImage) {
      slotCurrentImage.src = `/images/products/${pics[i].filename}`;
      slotCurrentImage.classList.remove("hidden");
    }
    if (slotPlaceholder) slotPlaceholder.classList.add("hidden");
    if (slotDeleteBtn) slotDeleteBtn.classList.remove("hidden");

    slotsContainer.append(slot);
  }
  if (pics.length === 0) {
    slotsContainer.append(buildPicSlot(0));
  }

  // Enable add-image button
  const addBtn = document.querySelector("[data-label='add-pic-slot']");
  if (addBtn) addBtn.disabled = false;

  return true;
};
