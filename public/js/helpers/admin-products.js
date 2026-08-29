import { clearAdminEditFields, disableAdminEditFields, enableAdminEditFields, updateProductStats } from "./admin-run.js";
import { sendToBack } from "../util/api-front.js";
import { buildNewProductParams, getEditProductParams } from "../util/params.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildPicSlot } from "../forms/admin-form.js";
import { confirmProductCodeUnique, resetAutoProductCode } from "./admin-categories.js";

let adminProductCache = [];

//Add product
export const runAddNewProduct = async () => {
  const newProductParams = await buildNewProductParams();
  if (!newProductParams || !newProductParams.name || !newProductParams.price) {
    await displayPopup("Please fill in all product fields before submitting", "error");
    return null;
  }

  // console.log("NEW PRODUCT PARAMS");
  // console.dir(newProductParams);

  // check if at least one image uploaded
  const slotBtns = document.querySelectorAll(".pic-slots-container .upload-btn");
  let hasImage = false;
  for (let i = 0; i < slotBtns.length; i++) {
    if (slotBtns[i].uploadData) {
      hasImage = true;
      break;
    }
  }
  if (!hasImage) {
    await displayPopup("Please upload at least one image or video of the product", "error");
    return null;
  }

  if (newProductParams.notifySubscribers) {
    const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
    const subscriberCount = subscriberData ? subscriberData.length : 0;
    const confirmed = await displayConfirmDialog(
      `Add this product and email it to ${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}?`
    );
    if (!confirmed) return null;
  }

  const idConfirmed = await confirmProductCodeUnique("add");
  if (!idConfirmed) return null;

  const data = await sendToBack(newProductParams);
  if (!data || !data.success) {
    await displayPopup("Failed to add new product", "error");
    return null;
  }

  // console.log("DATA");
  // console.dir(data);

  if (newProductParams.notifySubscribers && data.emailSent) {
    await displayPopup(`Product "${data.name}" added and emailed to ${data.subscriberCount} subscribers`, "success");
  } else if (newProductParams.notifySubscribers) {
    await displayPopup(`Product "${data.name}" added, but the subscriber email failed: ${data.emailMessage}`, "error");
  } else {
    await displayPopup(`Product "${data.name}" added successfully`, "success");
  }

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

  const idConfirmed = await confirmProductCodeUnique("edit", productId);
  if (!idConfirmed) return null;

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

    // A type change can move the product outside the active filter; retarget the filter so it stays selectable
    if (!findSelectorOption(productSelector, productId)) syncProductFilterToEdited(productId);

    // Re-select the product that was just updated so user can see the changes
    productSelector.value = productId;

    // Re-populate the form with the updated data
    const updatedOption = findSelectorOption(productSelector, productId);
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

  const existingUploadBtn = container.querySelector(".upload-btn");
  const entityType = existingUploadBtn?.entityType || "products";

  const index = container.children.length;
  const slot = buildPicSlot(index, entityType);
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
  const entityType = uploadBtn?.entityType || "products";
  const filename = uploadBtn?.uploadData?.filename;
  const originalFilename = uploadBtn?.uploadData?.originalFilename;

  if (filename) {
    await sendToBack({ route: "/delete-pic-route", filename, entityType });
  }
  if (originalFilename && originalFilename !== filename) {
    await sendToBack({ route: "/delete-pic-route", filename: originalFilename, entityType });
  }

  slot.remove();
};

//++++++++++++++++++

export const changeAdminProductSelector = async (changeElement) => {
  if (!changeElement) return null;

  await clearAdminEditFields();
  resetAdminPicSlots();

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
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

export const changeAdminProductFilter = async (changeElement) => {
  if (!changeElement) return null;

  const matchingProducts = getProductsByType(adminProductCache, changeElement.value);
  const rendered = renderAdminProductSelector(matchingProducts);
  if (!rendered) return null;

  // The rerender deselects any product, so the edit form must return to its placeholder state
  await clearAdminEditFields();
  resetAdminPicSlots();
  await disableAdminEditFields();
  return rendered;
};

// Reset product image slots to a single disabled empty slot
const resetAdminPicSlots = () => {
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
};

//+++++++++++++++++++++++++++++++++++++++++++++++

//DATA
export const populateAdminProductSelector = async (inputArray) => {
  if (!Array.isArray(inputArray)) return null;

  adminProductCache = inputArray;
  const productFilter = document.getElementById("edit-product-filter");
  const matchingProducts = getProductsByType(inputArray, productFilter?.value || "All");
  return renderAdminProductSelector(matchingProducts);
};

const getProductsByType = (products, productType) => {
  if (productType === "All") return products;

  const matchingProducts = [];
  for (let i = 0; i < products.length; i++) {
    if (products[i].productType === productType) matchingProducts.push(products[i]);
  }

  return matchingProducts;
};

const renderAdminProductSelector = (inputArray) => {

  const productSelector = document.getElementById("product-selector");
  if (!productSelector) return null;

  // Clear existing options except the default one
  const defaultOption = productSelector.querySelector("option[disabled]");
  productSelector.innerHTML = "";
  if (defaultOption) {
    productSelector.append(defaultOption);
  }

  productSelector.value = "";

  // Sort: letter-prefix productCodes first (A→Z), then numeric-only productCodes (low→high), then no productCode (alpha by name)
  const sortedProducts = [...inputArray];
  sortedProducts.sort((a, b) => {
    const aHasId = a.productCode != null && String(a.productCode).trim() !== "";
    const bHasId = b.productCode != null && String(b.productCode).trim() !== "";
    if (aHasId && bHasId) {
      const aStr = String(a.productCode);
      const bStr = String(b.productCode);
      const aIsAlpha = /^[a-zA-Z]/.test(aStr);
      const bIsAlpha = /^[a-zA-Z]/.test(bStr);
      if (aIsAlpha && !bIsAlpha) return -1;
      if (!aIsAlpha && bIsAlpha) return 1;
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
    }
    if (aHasId) return -1;
    if (bHasId) return 1;
    return a.name.localeCompare(b.name);
  });

  // Add all products as options
  for (let i = 0; i < sortedProducts.length; i++) {
    const product = sortedProducts[i];
    const option = document.createElement("option");
    option.value = product.productId;
    const hasId = product.productCode != null && String(product.productCode).trim() !== "";
    option.textContent = hasId
      ? `Product Code: ${product.productCode} | ${product.name}`
      : product.name;
    option.productData = product; //stores product data to then display on select
    productSelector.append(option);
  }

  return true;
};

const findSelectorOption = (productSelector, productId) => {
  if (!productSelector) return null;

  for (let i = 0; i < productSelector.options.length; i++) {
    if (String(productSelector.options[i].value) === String(productId)) return productSelector.options[i];
  }

  return null;
};

const syncProductFilterToEdited = (productId) => {
  const productFilter = document.getElementById("edit-product-filter");
  if (!productFilter) return null;

  const editedProduct = findCachedProduct(productId);
  if (!editedProduct) return null;

  const targetType = editedProduct.productType || "All";
  productFilter.value = targetType;
  if (productFilter.value !== targetType) productFilter.value = "All"; // the type key is missing from the filter options
  return renderAdminProductSelector(getProductsByType(adminProductCache, productFilter.value));
};

const findCachedProduct = (productId) => {
  for (let i = 0; i < adminProductCache.length; i++) {
    if (String(adminProductCache[i].productId) === String(productId)) return adminProductCache[i];
  }

  return null;
};

export const populateEditFormProducts = async (inputObj) => {
  if (!inputObj) return null;

  const { productCode, name, urlName, productType, price, description, display, sold, picData, canShip, length, width, height, weight } = inputObj;

  const adminEditMapArray = [
    { id: "edit-product-code", value: productCode },
    { id: "edit-name", value: name },
    { id: "edit-url-name", value: urlName },
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
  ];

  for (let i = 0; i < adminEditMapArray.length; i++) {
    const field = document.getElementById(adminEditMapArray[i].id);
    if (field) {
      field.value = adminEditMapArray[i].value || "";
    }
  }

  // The id now in the form is the product's saved id, not an auto-suggestion
  resetAutoProductCode("edit");

  // Sync CSS classes on status selects to match their values
  const statusIds = ["edit-display", "edit-sold", "edit-can-ship"];
  for (const id of statusIds) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("status-yes", "status-no");
      el.classList.add(`status-${el.value}`);
    }
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
      slotUploadBtn.textContent = "Change File";
    }
    const slotCurrentVideo = slot.querySelector(".current-video");
    if (pics[i].mediaType === "video") {
      if (slotCurrentVideo) {
        slotCurrentVideo.src = `/images/products/${pics[i].filename}`;
        slotCurrentVideo.classList.remove("hidden");
      }
      if (slotCurrentImage) slotCurrentImage.classList.add("hidden");
    } else {
      if (slotCurrentImage) {
        slotCurrentImage.src = `/images/products/${pics[i].filename}`;
        slotCurrentImage.classList.remove("hidden");
      }
      if (slotCurrentVideo) slotCurrentVideo.classList.add("hidden");
      const slotEditBtn = slot.querySelector(".edit-image-btn");
      if (slotEditBtn) slotEditBtn.classList.remove("hidden");
    }
    if (slotPlaceholder) slotPlaceholder.classList.add("hidden");
    if (slotDeleteBtn) slotDeleteBtn.classList.remove("hidden");

        const slotRevertBtn = slot.querySelector(".revert-image-btn");
        if (slotRevertBtn && pics[i].originalFilename && pics[i].filename !== pics[i].originalFilename) {
          slotRevertBtn.classList.remove("hidden");
        }

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
