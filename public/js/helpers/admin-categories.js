import { sendToBack } from "../util/api-front.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildLetterInput } from "../forms/admin-form.js";

// Last auto-assigned id per modal mode, so a saved id loaded into the edit
// form is never mistaken for one this page generated (add and edit are separate).
const lastAutoProductCodes = { add: "", edit: "" };
// Monotonic per-mode request ids: with several prefills in flight, only the newest may write the field
const prefillRequestIds = { add: 0, edit: 0 };
let categoryCache = null;

//LOAD (entry point: admin page init warms the cache; Edit Categories modal open + refresh/add/rename/delete/letter change fill the list)
export const loadCategories = async () => {
  const categoryArray = await sendToBack({ route: "/get-categories-route" }, "GET");
  if (!Array.isArray(categoryArray)) return null;

  categoryCache = categoryArray;

  await populateCategoryList(categoryArray);
  await populateCategorySelects(categoryArray);
  await prefillNextProductCode("add");

  return categoryArray;
};

//FILL (entry point, called when a product modal's DOM is built after loadCategories has already run once)
export const fillProductTypeSelects = async () => {
  if (!categoryCache) {
    categoryCache = await loadCategories();
  }
  if (!categoryCache) return null;

  await populateCategorySelects(categoryCache);
  await prefillNextProductCode("add");

  return true;
};

//++++++++++++++++++++++++++++++++++
//DATA (called by loadCategories)

export const populateCategoryList = async (categoryArray) => {
  const categoryList = document.getElementById("category-list");
  if (!categoryList) return null;

  categoryList.innerHTML = "";

  if (!categoryArray || !categoryArray.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "category-empty-state";
    emptyState.textContent = "No categories yet";
    categoryList.append(emptyState);
    return true;
  }

  for (let i = 0; i < categoryArray.length; i++) {
    const categoryItem = buildCategoryItem(categoryArray[i]);
    if (!categoryItem) continue;
    categoryList.append(categoryItem);
  }

  return true;
};

const buildCategoryItem = (category) => {
  if (!category) return null;
  const count = category.productCount || 0;

  const categoryItem = document.createElement("div");
  categoryItem.className = "category-item";
  categoryItem.setAttribute("data-key", category.key);

  const dragHandle = document.createElement("span");
  dragHandle.className = "category-drag-handle";
  dragHandle.setAttribute("data-label", "category-drag-handle");
  dragHandle.title = "Drag to reorder";
  dragHandle.textContent = "⠿";

  const letterInput = buildLetterInput(`category-letter-${category.key}`, category.letter);
  letterInput.classList.add("category-letter-select");
  letterInput.title = "Product Code prefix — change it to re-letter this category";
  letterInput.setAttribute("data-label", "category-letter-select");
  letterInput.setAttribute("data-key", category.key);
  letterInput.setAttribute("data-title", category.title);
  letterInput.setAttribute("data-count", count);
  letterInput.setAttribute("data-letter", category.letter || "");

  const titleInput = document.createElement("input");
  titleInput.className = "form-input category-title-input";
  titleInput.type = "text";
  titleInput.value = category.title;
  titleInput.maxLength = 60;
  titleInput.title = "Category name - edit and press Enter or click away to save";
  titleInput.setAttribute("aria-label", "Category name");
  titleInput.setAttribute("data-label", "category-title-input");
  titleInput.setAttribute("data-key", category.key);
  titleInput.setAttribute("data-title", category.title);

  const countSpan = document.createElement("span");
  countSpan.className = "category-count";
  countSpan.textContent = `${count} product${count === 1 ? "" : "s"}`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn-delete-category";
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.title = "Remove category";
  deleteButton.setAttribute("data-label", "remove-category");
  deleteButton.setAttribute("data-key", category.key);
  deleteButton.setAttribute("data-title", category.title);
  deleteButton.setAttribute("data-count", count);

  categoryItem.append(dragHandle, titleInput, letterInput, countSpan, deleteButton);
  return categoryItem;
};

export const populateCategorySelects = async (categoryArray) => {
  if (!categoryArray) return null;

  const selectIds = ["product-type", "edit-product-type", "edit-product-filter"];
  for (let i = 0; i < selectIds.length; i++) {
    const select = document.getElementById(selectIds[i]);
    if (!select) continue;

    const currentValue = select.value;

    select.innerHTML = "";
    if (select.id === "edit-product-filter") {
      const allOption = document.createElement("option");
      allOption.value = "All";
      allOption.textContent = "All";
      select.append(allOption);
    }
    for (let j = 0; j < categoryArray.length; j++) {
      const category = categoryArray[j];
      const option = document.createElement("option");
      option.value = category.key;
      option.textContent = category.title;
      select.append(option);
    }

    let stillExists = currentValue === "All" && select.id === "edit-product-filter";
    for (let j = 0; j < categoryArray.length; j++) {
      if (categoryArray[j].key === currentValue) {
        stillExists = true;
        break;
      }
    }

    if (stillExists) {
      select.value = currentValue;
    } else if (select.id === "edit-product-filter") {
      select.value = "All";
    } else if (select.options.length) {
      select.options[0].selected = true;
    }
  }

  return true;
};

//++++++++++++++++++++++++++++++++++
//PRODUCT CODE (wired to product-type change events)

export const prefillNextProductCode = async (mode) => {
  const productCodeInput = document.getElementById(mode === "edit" ? "edit-product-code" : "product-code");
  if (!productCodeInput) return null;

  const currentValue = productCodeInput.value.trim();
  if (currentValue && currentValue !== lastAutoProductCodes[mode]) return null;

  const productTypeSelect = document.getElementById(mode === "edit" ? "edit-product-type" : "product-type");
  if (!productTypeSelect || !productTypeSelect.value) return null;

  const requestId = ++prefillRequestIds[mode];
  const data = await sendToBack({ route: "/next-product-code-route", productType: productTypeSelect.value });
  if (!data || !data.productCode) return null;

  // A newer prefill owns the field — this response is for a category no longer selected
  if (requestId !== prefillRequestIds[mode]) return null;
  // The admin may have typed while the request was in flight — never clobber that
  if (productCodeInput.value.trim() !== currentValue) return null;

  lastAutoProductCodes[mode] = data.productCode;
  productCodeInput.value = data.productCode;
  return data.productCode;
};

// Called whenever a saved product is loaded into the edit form: its id is the
// product's own, not an auto-suggestion, so a category change must not replace it.
export const resetAutoProductCode = (mode) => {
  if (!(mode in lastAutoProductCodes)) return null;

  lastAutoProductCodes[mode] = "";
  return true;
};

export const confirmProductCodeUnique = async (mode, productId) => {
  const productCodeInput = document.getElementById(mode === "edit" ? "edit-product-code" : "product-code");
  if (!productCodeInput) return true;

  const productCode = productCodeInput.value.trim();
  if (!productCode) return true;

  const data = await sendToBack({ route: "/check-product-code-route", productCode, productId });
  if (!data || !data.exists) return true;

  const confirmDialog = await displayConfirmDialog(`Product Code ${productCode} is already used by "${data.name}". Use it anyway?`);
  return !!confirmDialog;
};

//++++++++++++++++++++++++++++++++++
//ADD / RENAME / CHANGE LETTER / DELETE CATEGORY (wired to responsive.js click + change handlers)

// Trims/uppercases a typed prefix and checks it against the backend rule (1-3 letters A-Z);
// shows the same error the backend would return and yields null so callers can bail out.
const normalizeCategoryLetter = async (rawLetter) => {
  const letter = (rawLetter || "").trim().toUpperCase();
  if (!/^[A-Z]{1,3}$/.test(letter)) {
    await displayPopup("Letter must be 1-3 letters A-Z", "error");
    return null;
  }

  return letter;
};

export const runAddCategory = async () => {
  const titleInput = document.getElementById("new-category-title");
  const letterInput = document.getElementById("new-category-letter");
  if (!titleInput || !letterInput) return null;

  const title = titleInput.value.trim();
  if (!title) {
    await displayPopup("Please enter a category name and a letter", "error");
    return null;
  }

  const letter = await normalizeCategoryLetter(letterInput.value);
  if (!letter) return null;
  letterInput.value = letter;

  const data = await sendToBack({ route: "/add-category-route", title, letter });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to add category", "error");
    return null;
  }

  await displayPopup(data.message || "Category added successfully", "success");
  titleInput.value = "";
  await loadCategories();

  return data;
};

// Saving the name keeps the category's key (what products point at); only the display title changes.
export const runRenameCategory = async (inputElement) => {
  if (!inputElement) return null;

  const key = inputElement.getAttribute("data-key");
  const oldTitle = inputElement.getAttribute("data-title") || "";
  const newTitle = inputElement.value.trim();
  if (!key) return null;

  if (!newTitle) {
    inputElement.value = oldTitle;
    await displayPopup("Category name cannot be empty", "error");
    return null;
  }
  if (newTitle === oldTitle) {
    inputElement.value = oldTitle;
    return null;
  }

  const data = await sendToBack({ route: "/update-category-title-route", key, title: newTitle });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to rename category", "error");
    inputElement.value = oldTitle;
    return null;
  }

  await displayPopup(data.message || `Category renamed to "${newTitle}"`, "success");
  await loadCategories();

  return data;
};

// The letter change itself always saves; the popup only decides whether the
// category's existing <OLD>### product codes are renamed to <NEW>### as well.
export const runChangeCategoryLetter = async (inputElement) => {
  if (!inputElement) return null;

  const key = inputElement.getAttribute("data-key");
  const title = inputElement.getAttribute("data-title");
  const count = Number(inputElement.getAttribute("data-count")) || 0;
  const oldLetter = inputElement.getAttribute("data-letter");
  if (!key) return null;

  const newLetter = await normalizeCategoryLetter(inputElement.value);
  if (!newLetter) {
    inputElement.value = oldLetter;
    return null;
  }

  inputElement.value = newLetter;
  if (newLetter === oldLetter) return null;

  const renumber = await confirmRenameProductCodes(title, count, oldLetter, newLetter);

  const data = await sendToBack({ route: "/update-category-letter-route", key, letter: newLetter, renumber });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to change category letter", "error");
    if (oldLetter) inputElement.value = oldLetter;
    return null;
  }

  await displayPopup(data.message || `Letter changed to ${newLetter}`, "success");
  await loadCategories();

  return data;
};

const confirmRenameProductCodes = async (title, count, oldLetter, newLetter) => {
  if (!count || !oldLetter) return false;

  const message =
    `"${title}" will now use the letter ${newLetter}. ` +
    `Also rename the product codes of its ${count} product${count === 1 ? "" : "s"} from ${oldLetter}### to ${newLetter}###? ` +
    `(No keeps their current IDs.)`;
  const confirmDialog = await displayConfirmDialog(message);
  return !!confirmDialog;
};

export const runDeleteCategory = async (button) => {
  if (!button) return null;

  const key = button.getAttribute("data-key");
  const title = button.getAttribute("data-title");
  const count = button.getAttribute("data-count");
  if (!key) return null;

  const confirmMessage = `Delete category "${title}"? ${count} product(s) use it; they keep their category but it disappears from the list.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);
  if (!confirmDialog) return null;

  const data = await sendToBack({ route: "/delete-category-route", key });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to delete category", "error");
    return null;
  }

  await displayPopup(data.message || `Category "${title}" deleted successfully`, "success");
  await loadCategories();

  return data;
};

//++++++++++++++++++++++++++++++++++
//DRAG REORDER (wired to responsive.js mousedown/mousemove/mouseup + touch handlers)

let draggingCategoryItem = null;

// Pure query: current on-screen order of category keys, in DOM order. Used both to
// persist a finished drag and to detect whether anything actually moved.
export const buildOrderedCategoryKeys = (listElement) => {
  if (!listElement) return null;

  const orderedKeys = [];
  for (let i = 0; i < listElement.children.length; i++) {
    const child = listElement.children[i];
    if (!child.classList.contains("category-item")) continue;

    const key = child.getAttribute("data-key");
    if (!key) continue;

    orderedKeys.push(key);
  }

  return orderedKeys;
};

// Arms drag state for the row under the given handle; call on mousedown/touchstart.
export const startCategoryDrag = (handleElement) => {
  if (!handleElement) return null;
  if (draggingCategoryItem) return null; // a second pointer (e.g. second finger) must not steal the armed drag — it would orphan the first row's .dragging class

  const categoryItem = handleElement.closest(".category-item");
  if (!categoryItem) return null;

  draggingCategoryItem = categoryItem;
  categoryItem.classList.add("dragging");

  return true;
};

// Repositions the dragged row among its siblings; call on mousemove/touchmove.
export const moveCategoryDrag = (clientY) => {
  if (!draggingCategoryItem) return null;

  const listElement = document.getElementById("category-list");
  if (!listElement) return null;

  let targetSibling = null;
  for (let i = 0; i < listElement.children.length; i++) {
    const sibling = listElement.children[i];
    if (sibling === draggingCategoryItem) continue;
    if (!sibling.classList.contains("category-item")) continue;

    const rect = sibling.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (midpoint <= clientY) continue;

    targetSibling = sibling;
    break;
  }

  if (targetSibling) {
    listElement.insertBefore(draggingCategoryItem, targetSibling);
  } else {
    listElement.append(draggingCategoryItem);
  }

  return true;
};

// Compares the just-dropped order against the cache loadCategories last filled, so a
// drag that ends where it started doesn't trigger a needless save + popup.
const hasCategoryOrderChanged = (orderedKeys) => {
  if (!categoryCache || categoryCache.length !== orderedKeys.length) return true;

  for (let i = 0; i < orderedKeys.length; i++) {
    if (categoryCache[i].key !== orderedKeys[i]) return true;
  }

  return false;
};

// Drops the dragged row where it landed; persists the new order if it actually changed.
export const endCategoryDrag = async () => {
  if (!draggingCategoryItem) return null;

  const listElement = document.getElementById("category-list");
  draggingCategoryItem.classList.remove("dragging");
  draggingCategoryItem = null;

  const orderedKeys = buildOrderedCategoryKeys(listElement);
  if (!orderedKeys || !hasCategoryOrderChanged(orderedKeys)) return null;

  const data = await sendToBack({ route: "/update-category-order-route", orderedKeys });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to reorder categories", "error");
    await loadCategories();
    return null;
  }

  await displayPopup(data.message || "Category order updated", "success");
  await loadCategories();

  return data;
};

// Abandons an in-progress drag without saving; call on blur/visibilitychange/touchcancel.
export const cancelCategoryDrag = () => {
  if (!draggingCategoryItem) return null;

  draggingCategoryItem.classList.remove("dragging");
  draggingCategoryItem = null;

  return true;
};
