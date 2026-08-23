import { sendToBack } from "../util/api-front.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { buildLetterSelect } from "../forms/admin-form.js";

// Last auto-assigned id per modal mode, so a saved id loaded into the edit
// form is never mistaken for one this page generated (add and edit are separate).
const lastAutoItemIds = { add: "", edit: "" };
let categoryCache = null;

//LOAD (entry point: admin page init warms the cache; Edit Categories modal open + refresh/add/rename/delete/letter change fill the list)
export const loadCategories = async () => {
  const categoryArray = await sendToBack({ route: "/get-categories-route" }, "GET");
  if (!Array.isArray(categoryArray)) return null;

  categoryCache = categoryArray;

  await populateCategoryList(categoryArray);
  await populateCategorySelects(categoryArray);
  await prefillNextItemId("add");

  return categoryArray;
};

//FILL (entry point, called when a product modal's DOM is built after loadCategories has already run once)
export const fillProductTypeSelects = async () => {
  if (!categoryCache) {
    categoryCache = await loadCategories();
  }
  if (!categoryCache) return null;

  await populateCategorySelects(categoryCache);
  await prefillNextItemId("add");

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

  const letterSelect = buildLetterSelect(`category-letter-${category.key}`, category.letter);
  letterSelect.classList.add("category-letter-select");
  letterSelect.title = "Item ID prefix — change it to re-letter this category";
  letterSelect.setAttribute("data-label", "category-letter-select");
  letterSelect.setAttribute("data-key", category.key);
  letterSelect.setAttribute("data-title", category.title);
  letterSelect.setAttribute("data-count", count);
  letterSelect.setAttribute("data-letter", category.letter || "");

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

  categoryItem.append(titleInput, letterSelect, countSpan, deleteButton);
  return categoryItem;
};

export const populateCategorySelects = async (categoryArray) => {
  if (!categoryArray) return null;

  const selectIds = ["product-type", "edit-product-type"];
  for (let i = 0; i < selectIds.length; i++) {
    const select = document.getElementById(selectIds[i]);
    if (!select) continue;

    const currentValue = select.value;

    select.innerHTML = "";
    for (let j = 0; j < categoryArray.length; j++) {
      const category = categoryArray[j];
      const option = document.createElement("option");
      option.value = category.key;
      option.textContent = category.title;
      select.append(option);
    }

    let stillExists = false;
    for (let j = 0; j < categoryArray.length; j++) {
      if (categoryArray[j].key === currentValue) {
        stillExists = true;
        break;
      }
    }

    if (stillExists) {
      select.value = currentValue;
    } else if (select.options.length) {
      select.options[0].selected = true;
    }
  }

  return true;
};

//++++++++++++++++++++++++++++++++++
//ITEM ID (wired to product-type change events)

export const prefillNextItemId = async (mode) => {
  const itemIdInput = document.getElementById(mode === "edit" ? "edit-item-id" : "item-id");
  if (!itemIdInput) return null;

  const currentValue = itemIdInput.value.trim();
  if (currentValue && currentValue !== lastAutoItemIds[mode]) return null;

  const productTypeSelect = document.getElementById(mode === "edit" ? "edit-product-type" : "product-type");
  if (!productTypeSelect || !productTypeSelect.value) return null;

  const data = await sendToBack({ route: "/next-item-id-route", productType: productTypeSelect.value });
  if (!data || !data.itemId) return null;

  lastAutoItemIds[mode] = data.itemId;
  itemIdInput.value = data.itemId;
  return data.itemId;
};

// Called whenever a saved product is loaded into the edit form: its id is the
// product's own, not an auto-suggestion, so a category change must not replace it.
export const resetAutoItemId = (mode) => {
  if (!(mode in lastAutoItemIds)) return null;

  lastAutoItemIds[mode] = "";
  return true;
};

export const confirmItemIdUnique = async (mode, productId) => {
  const itemIdInput = document.getElementById(mode === "edit" ? "edit-item-id" : "item-id");
  if (!itemIdInput) return true;

  const itemId = itemIdInput.value.trim();
  if (!itemId) return true;

  const data = await sendToBack({ route: "/check-item-id-route", itemId, productId });
  if (!data || !data.exists) return true;

  const confirmDialog = await displayConfirmDialog(`Item ID ${itemId} is already used by "${data.name}". Use it anyway?`);
  return !!confirmDialog;
};

//++++++++++++++++++++++++++++++++++
//ADD / RENAME / CHANGE LETTER / DELETE CATEGORY (wired to responsive.js click + change handlers)

export const runAddCategory = async () => {
  const titleInput = document.getElementById("new-category-title");
  const letterSelect = document.getElementById("new-category-letter");
  if (!titleInput || !letterSelect) return null;

  const title = titleInput.value.trim();
  const letter = letterSelect.value;
  if (!title || !letter) {
    await displayPopup("Please enter a category name and pick a letter", "error");
    return null;
  }

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
// category's existing <OLD>### item IDs are renamed to <NEW>### as well.
export const runChangeCategoryLetter = async (selectElement) => {
  if (!selectElement) return null;

  const key = selectElement.getAttribute("data-key");
  const title = selectElement.getAttribute("data-title");
  const count = Number(selectElement.getAttribute("data-count")) || 0;
  const oldLetter = selectElement.getAttribute("data-letter");
  const newLetter = selectElement.value;
  if (!key || !newLetter || newLetter === oldLetter) return null;

  const renumber = await confirmRenameItemIds(title, count, oldLetter, newLetter);

  const data = await sendToBack({ route: "/update-category-letter-route", key, letter: newLetter, renumber });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to change category letter", "error");
    if (oldLetter) selectElement.value = oldLetter;
    return null;
  }

  await displayPopup(data.message || `Letter changed to ${newLetter}`, "success");
  await loadCategories();

  return data;
};

const confirmRenameItemIds = async (title, count, oldLetter, newLetter) => {
  if (!count || !oldLetter) return false;

  const message =
    `"${title}" will now use the letter ${newLetter}. ` +
    `Also rename the item IDs of its ${count} product${count === 1 ? "" : "s"} from ${oldLetter}### to ${newLetter}###? ` +
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
