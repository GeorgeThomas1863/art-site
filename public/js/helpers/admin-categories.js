import { sendToBack } from "../util/api-front.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";

// Last auto-assigned id per modal mode, so a saved id loaded into the edit
// form is never mistaken for one this page generated (add and edit are separate).
const lastAutoItemIds = { add: "", edit: "" };
let categoryCache = null;

//LOAD (entry point, called on admin page init and on refresh)
export const loadCategories = async () => {
  const categoryArray = await sendToBack({ route: "/get-categories-route" }, "GET");
  if (!Array.isArray(categoryArray)) return null;

  categoryCache = categoryArray;

  await populateCategoryList(categoryArray);
  await populateCategorySelects(categoryArray);
  await updateLetterOptions(categoryArray);
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
    const category = categoryArray[i];
    const count = category.productCount || 0;

    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";

    const letterSpan = document.createElement("span");
    letterSpan.className = "category-letter";
    letterSpan.textContent = category.letter;

    const titleSpan = document.createElement("span");
    titleSpan.className = "category-title";
    titleSpan.textContent = category.title;

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

    categoryItem.append(letterSpan, titleSpan, countSpan, deleteButton);
    categoryList.append(categoryItem);
  }

  return true;
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

export const updateLetterOptions = async (categoryArray) => {
  const letterSelect = document.getElementById("new-category-letter");
  if (!letterSelect) return null;

  const categories = categoryArray || [];
  const options = letterSelect.options;

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    let usedBy = null;
    for (let j = 0; j < categories.length; j++) {
      if (categories[j].letter === option.value) {
        usedBy = categories[j];
        break;
      }
    }

    if (usedBy) {
      option.disabled = true;
      option.textContent = `${option.value} (${usedBy.title})`;
    } else {
      option.disabled = false;
      option.textContent = option.value;
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
//ADD / DELETE CATEGORY (wired to responsive.js clickHandler)

export const runAddCategory = async () => {
  const titleInput = document.getElementById("new-category-title");
  const letterSelect = document.getElementById("new-category-letter");
  if (!titleInput || !letterSelect) return null;

  const title = titleInput.value.trim();
  const letter = letterSelect.value;
  if (!title || !letter) {
    await displayPopup("Please enter a title and select a letter", "error");
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
