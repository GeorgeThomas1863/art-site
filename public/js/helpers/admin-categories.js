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
  populateSubcategorySelect("add");
  populateSubcategorySelect("edit");
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
  populateSubcategorySelect("add");
  populateSubcategorySelect("edit");
  await prefillNextProductCode("add");

  return true;
};

//++++++++++++++++++++++++++++++++++
//DATA (called by loadCategories)

export const populateCategoryList = async (categoryArray) => {
  const categoryList = document.getElementById("category-list");
  if (!categoryList) return null;

  // Read before the redraw so an add row the admin opened stays open (a fresh modal has none open)
  const openAddKeys = findOpenSubcategoryAddKeys(categoryList);
  const descriptionOpenStates = findDescriptionOpenStates(categoryList);
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
    const categoryItem = buildCategoryItem(category, openAddKeys.has(category.key), shouldOpenDescription(category, descriptionOpenStates));
    if (!categoryItem) continue;
    categoryList.append(categoryItem);
  }

  return true;
};

const findOpenSubcategoryAddKeys = (categoryList) => {
  const openKeys = new Set();
  const openRows = categoryList.querySelectorAll(".subcategory-add-row:not(.hidden)");
  for (let i = 0; i < openRows.length; i++) {
    openKeys.add(openRows[i].getAttribute("data-category-key"));
  }

  return openKeys;
};

// Map of category key -> whether its description box is open, for rows already on screen
const findDescriptionOpenStates = (categoryList) => {
  const openStates = new Map();
  const rows = categoryList.querySelectorAll(".category-description-row");
  for (let i = 0; i < rows.length; i++) {
    openStates.set(rows[i].getAttribute("data-category-key"), !rows[i].classList.contains("hidden"));
  }

  return openStates;
};

// A row already on screen keeps the admin's open/hidden choice; a new row starts open only if it has a description
const shouldOpenDescription = (category, openStates) => {
  if (openStates.has(category.key)) return openStates.get(category.key);
  return Boolean(category.description);
};

const buildCategoryItem = (category, isAddOpen, isDescriptionOpen) => {
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

  const subcategoryPanel = buildSubcategoryPanel(category, isAddOpen, isDescriptionOpen);

  categoryItem.append(dragHandle, titleInput, letterInput, countSpan, deleteButton, subcategoryPanel);
  return categoryItem;
};

// "+ Add description" link plus the description box it shows/hides (collapsed by default)
const buildDescriptionPanel = (category, isOpen) => {
  const panel = document.createElement("div");
  panel.className = "category-description-panel";

  const toggleRow = document.createElement("div");
  toggleRow.className = "subcategory-row subcategory-toggle-row";

  const toggleButton = document.createElement("button");
  toggleButton.className = "btn-toggle-subcategory-add btn-toggle-description";
  toggleButton.type = "button";
  toggleButton.id = `toggle-description-${category.key}`;
  toggleButton.setAttribute("data-label", "toggle-category-description");
  toggleButton.setAttribute("data-category-key", category.key);
  toggleButton.setAttribute("data-has-description", Boolean(category.description));
  setDescriptionToggleState(toggleButton, isOpen);

  toggleRow.append(document.createElement("span"), toggleButton);

  const editRow = document.createElement("div");
  editRow.className = isOpen ? "category-description-row" : "category-description-row hidden";
  editRow.id = `category-description-row-${category.key}`;
  editRow.setAttribute("data-category-key", category.key);
  editRow.append(document.createElement("span"), buildCategoryDescriptionInput(category), buildDeleteDescriptionButton(category));

  panel.append(toggleRow, editRow);
  return panel;
};

const setDescriptionToggleState = (toggleButton, isOpen) => {
  const hasDescription = toggleButton.getAttribute("data-has-description") === "true";
  const closedLabel = hasDescription ? "Edit description" : "+ Add description";
  toggleButton.textContent = isOpen ? "− Hide description" : closedLabel;
  toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

// Same red × as the subcategory remove button; only shown once a description is saved
const buildDeleteDescriptionButton = (category) => {
  const deleteButton = document.createElement("button");
  deleteButton.className = category.description ? "btn-delete-category btn-delete-description" : "btn-delete-category btn-delete-description hidden";
  deleteButton.type = "button";
  deleteButton.id = `delete-description-${category.key}`;
  deleteButton.textContent = "×";
  deleteButton.title = "Delete description";
  deleteButton.setAttribute("data-label", "remove-category-description");
  deleteButton.setAttribute("data-key", category.key);
  deleteButton.setAttribute("data-title", category.title);

  return deleteButton;
};

// Text shown under the category heading on the products page; saves when the box loses focus
const buildCategoryDescriptionInput = (category) => {
  const descriptionInput = document.createElement("textarea");
  descriptionInput.className = "form-input category-description-input";
  descriptionInput.id = `category-description-${category.key}`;
  descriptionInput.rows = 3;
  descriptionInput.maxLength = 3000;
  descriptionInput.value = category.description || "";
  descriptionInput.placeholder = "Description shown on the products page (optional)";
  descriptionInput.title = "Category description - click away to save";
  descriptionInput.setAttribute("aria-label", `${category.title} description`);
  descriptionInput.setAttribute("data-label", "category-description-input");
  descriptionInput.setAttribute("data-key", category.key);
  descriptionInput.setAttribute("data-description", category.description || "");

  return descriptionInput;
};

// Description (or "+ Add description" link) first, then subcategory rows, then add-subcategory link
const buildSubcategoryPanel = (category, isAddOpen, isDescriptionOpen) => {
  const panel = document.createElement("div");
  panel.className = "subcategory-panel";
  panel.append(buildDescriptionPanel(category, isDescriptionOpen));

  const subcategories = category.subcategories || [];
  for (let i = 0; i < subcategories.length; i++) {
    panel.append(buildSubcategoryRow(category, subcategories[i], i, subcategories.length));
  }

  panel.append(buildSubcategoryToggleRow(category, isAddOpen), buildAddSubcategoryRow(category, isAddOpen));
  return panel;
};

// "+ Add subcategory" link that shows/hides the add row below it (collapsed by default)
const buildSubcategoryToggleRow = (category, isAddOpen) => {
  const row = document.createElement("div");
  row.className = "subcategory-row subcategory-toggle-row";

  const spacer = document.createElement("span");

  const toggleButton = document.createElement("button");
  toggleButton.className = "btn-toggle-subcategory-add";
  toggleButton.type = "button";
  toggleButton.id = `toggle-subcategory-add-${category.key}`;
  toggleButton.setAttribute("data-label", "toggle-add-subcategory");
  toggleButton.setAttribute("data-category-key", category.key);
  toggleButton.setAttribute("data-has-subcategories", (category.subcategories || []).length > 0);
  setSubcategoryToggleState(toggleButton, isAddOpen);

  row.append(spacer, toggleButton);
  return row;
};

const setSubcategoryToggleState = (toggleButton, isOpen) => {
  const hasSubcategories = toggleButton.getAttribute("data-has-subcategories") === "true";
  const closedLabel = hasSubcategories ? "+ Add more subcategories" : "+ Add subcategory";
  toggleButton.textContent = isOpen ? "− Hide" : closedLabel;
  toggleButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

// Optional 1-3 letter prefix; the placeholder shows the category prefix used when it is left blank
const buildSubcategoryLetterInput = (id, letter, category) => {
  const letterInput = buildLetterInput(id, letter);
  letterInput.classList.add("subcategory-letter-input");
  letterInput.placeholder = category.letter || "";
  letterInput.title = `Product Code prefix for this subcategory. Leave blank to use the category prefix (${category.letter || "none"}).`;
  letterInput.setAttribute("aria-label", "Subcategory product code prefix");
  return letterInput;
};

const buildSubcategoryRow = (category, subcategory, index, total) => {
  const categoryKey = category.key;
  const row = document.createElement("div");
  row.className = "subcategory-row";

  const titleInput = document.createElement("input");
  titleInput.className = "form-input subcategory-title-input";
  titleInput.type = "text";
  titleInput.value = subcategory.title;
  titleInput.maxLength = 60;
  titleInput.title = "Subcategory name - edit and press Enter or click away to save";
  titleInput.setAttribute("aria-label", "Subcategory name");
  titleInput.setAttribute("data-label", "subcategory-title-input");
  setSubcategoryAttributes(titleInput, categoryKey, subcategory);

  const letterInput = buildSubcategoryLetterInput(`subcategory-letter-${categoryKey}-${subcategory.key}`, subcategory.letter, category);
  letterInput.setAttribute("data-label", "subcategory-letter-input");
  letterInput.setAttribute("data-letter", subcategory.letter || "");
  letterInput.setAttribute("data-category-letter", category.letter || "");
  letterInput.setAttribute("data-count", subcategory.productCount || 0);
  setSubcategoryAttributes(letterInput, categoryKey, subcategory);

  // Rows share the category row's grid columns: marker under the drag handle, arrows under the product count
  const marker = document.createElement("span");
  marker.className = "subcategory-marker";
  marker.textContent = "↳";

  const moveGroup = document.createElement("div");
  moveGroup.className = "subcategory-move-group";
  const upButton = buildSubcategoryMoveButton(categoryKey, subcategory, "up", index === 0);
  const downButton = buildSubcategoryMoveButton(categoryKey, subcategory, "down", index === total - 1);
  moveGroup.append(upButton, downButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn-delete-category btn-delete-subcategory";
  deleteButton.type = "button";
  deleteButton.textContent = "×";
  deleteButton.title = "Remove subcategory";
  deleteButton.setAttribute("data-label", "remove-subcategory");
  setSubcategoryAttributes(deleteButton, categoryKey, subcategory);

  row.append(marker, titleInput, letterInput, moveGroup, deleteButton);
  return row;
};

const buildSubcategoryMoveButton = (categoryKey, subcategory, direction, isDisabled) => {
  const button = document.createElement("button");
  button.className = "btn-move-subcategory";
  button.type = "button";
  button.textContent = direction === "up" ? "▲" : "▼";
  button.title = direction === "up" ? "Move up" : "Move down";
  button.disabled = isDisabled;
  button.setAttribute("data-label", "move-subcategory");
  button.setAttribute("data-direction", direction);
  setSubcategoryAttributes(button, categoryKey, subcategory);
  return button;
};

const setSubcategoryAttributes = (element, categoryKey, subcategory) => {
  element.setAttribute("data-category-key", categoryKey);
  element.setAttribute("data-key", subcategory.key);
  element.setAttribute("data-title", subcategory.title);
};

const buildAddSubcategoryRow = (category, isAddOpen) => {
  const categoryKey = category.key;
  const row = document.createElement("div");
  row.className = "subcategory-row subcategory-add-row";
  row.id = `subcategory-add-row-${categoryKey}`;
  row.setAttribute("data-category-key", categoryKey);
  row.classList.toggle("hidden", !isAddOpen);

  const titleInput = document.createElement("input");
  titleInput.className = "form-input subcategory-new-input";
  titleInput.type = "text";
  titleInput.id = `new-subcategory-${categoryKey}`;
  titleInput.maxLength = 60;
  titleInput.placeholder = "e.g. Earrings";
  titleInput.setAttribute("aria-label", "New subcategory name");
  titleInput.setAttribute("data-label", "new-subcategory-input");
  titleInput.setAttribute("data-category-key", categoryKey);

  const addButton = document.createElement("button");
  addButton.className = "btn-add-subcategory";
  addButton.type = "button";
  addButton.textContent = "Add";
  addButton.setAttribute("data-label", "add-subcategory");
  addButton.setAttribute("data-category-key", categoryKey);

  const letterInput = buildSubcategoryLetterInput(`new-subcategory-letter-${categoryKey}`, "", category);
  letterInput.setAttribute("data-label", "new-subcategory-input");
  letterInput.setAttribute("data-category-key", categoryKey);

  // Button + name share the name column so the letter input lands in the letter column
  const spacer = document.createElement("span");
  const addGroup = document.createElement("div");
  addGroup.className = "subcategory-add-group";
  addGroup.append(addButton, titleInput);

  row.append(spacer, addGroup, letterInput);
  return row;
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

// Fills a product form's Subcategory dropdown from its chosen category and hides the row when that
// category has none. Without selectedKey the current pick is kept if the new list still has it.
export const populateSubcategorySelect = (mode, selectedKey) => {
  const typeSelect = document.getElementById(mode === "edit" ? "edit-product-type" : "product-type");
  const subSelect = document.getElementById(mode === "edit" ? "edit-product-sub-type" : "product-sub-type");
  if (!typeSelect || !subSelect) return null;

  const keyToSelect = selectedKey ?? subSelect.value;
  const subcategories = findCachedSubcategories(typeSelect.value);

  subSelect.innerHTML = "";
  subSelect.append(buildSubcategoryOption("", "None"));
  for (let i = 0; i < subcategories.length; i++) {
    subSelect.append(buildSubcategoryOption(subcategories[i].key, subcategories[i].title));
  }

  // A saved product can point at a deleted subcategory; keep that key so an edit-save doesn't erase it
  if (mode === "edit" && keyToSelect && !hasSubcategoryKey(subcategories, keyToSelect)) {
    subSelect.append(buildSubcategoryOption(keyToSelect, `${keyToSelect} (deleted)`));
  }

  subSelect.value = keyToSelect;
  if (subSelect.value !== keyToSelect) subSelect.value = "";

  const row = subSelect.closest(".info-row");
  if (row) row.classList.toggle("hidden", subSelect.options.length <= 1);
  return true;
};

const hasSubcategoryKey = (subcategories, key) => {
  for (let i = 0; i < subcategories.length; i++) {
    if (subcategories[i].key === key) return true;
  }

  return false;
};

const findCachedSubcategories = (categoryKey) => {
  if (!categoryCache) return [];

  for (let i = 0; i < categoryCache.length; i++) {
    if (categoryCache[i].key === categoryKey) return categoryCache[i].subcategories || [];
  }

  return [];
};

const buildSubcategoryOption = (value, text) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
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

  // A lettered subcategory changes the prefix, so the suggestion depends on it too
  const productSubType = document.getElementById(mode === "edit" ? "edit-product-sub-type" : "product-sub-type")?.value || "";

  const requestId = ++prefillRequestIds[mode];
  const data = await sendToBack({ route: "/next-product-code-route", productType: productTypeSelect.value, productSubType });
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

export const runSaveCategoryDescription = async (inputElement) => {
  if (!inputElement) return null;

  const key = inputElement.getAttribute("data-key");
  const oldDescription = inputElement.getAttribute("data-description") || "";
  const newDescription = inputElement.value.trim();
  if (!key) return null;
  if (newDescription === oldDescription) return null;

  const data = await sendToBack({ route: "/update-category-description-route", key, description: newDescription });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to save description", "error");
    inputElement.value = oldDescription;
    return null;
  }

  inputElement.value = newDescription;
  inputElement.setAttribute("data-description", newDescription);
  updateDescriptionToggleLabel(key, newDescription);
  await displayPopup(data.message || "Description saved", "success");

  return data;
};

export const runDeleteCategoryDescription = async (button) => {
  if (!button) return null;

  const key = button.getAttribute("data-key");
  const title = button.getAttribute("data-title");
  if (!key) return null;

  const confirmDialog = await displayConfirmDialog(`Delete the description for "${title}"?`);
  if (!confirmDialog) return null;

  const data = await sendToBack({ route: "/update-category-description-route", key, description: "" });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to delete description", "error");
    return null;
  }

  const inputElement = document.getElementById(`category-description-${key}`);
  if (inputElement) {
    inputElement.value = "";
    inputElement.setAttribute("data-description", "");
  }
  updateDescriptionToggleLabel(key, "");
  await displayPopup(`Description deleted for "${title}"`, "success");

  return data;
};

// After a save, the closed link reads "Edit description" or "+ Add description" to match,
// and the delete button shows only while there is a saved description
const updateDescriptionToggleLabel = (key, description) => {
  document.getElementById(`delete-description-${key}`)?.classList.toggle("hidden", !description);

  const toggleButton = document.getElementById(`toggle-description-${key}`);
  if (!toggleButton) return null;

  const isOpen = toggleButton.getAttribute("aria-expanded") === "true";
  toggleButton.setAttribute("data-has-description", Boolean(description));
  setDescriptionToggleState(toggleButton, isOpen);

  return true;
};

// Opens or closes one category's description box; opening puts the cursor in it
export const toggleDescriptionRow = (toggleButton) => {
  if (!toggleButton) return null;

  const categoryKey = toggleButton.getAttribute("data-category-key");
  const editRow = document.getElementById(`category-description-row-${categoryKey}`);
  if (!editRow) return null;

  const isOpen = editRow.classList.toggle("hidden") === false;
  setDescriptionToggleState(toggleButton, isOpen);
  if (isOpen) document.getElementById(`category-description-${categoryKey}`)?.focus();

  return isOpen;
};

// Escape inside the description box closes it and returns focus to its toggle link (the blur saves it)
export const closeDescriptionRow = (inputElement) => {
  if (!inputElement) return null;

  const categoryKey = inputElement.getAttribute("data-key");
  const editRow = document.getElementById(`category-description-row-${categoryKey}`);
  const toggleButton = document.getElementById(`toggle-description-${categoryKey}`);
  if (!editRow || !toggleButton) return null;

  editRow.classList.add("hidden");
  setDescriptionToggleState(toggleButton, false);
  toggleButton.focus();

  return true;
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
//ADD / RENAME / MOVE / DELETE SUBCATEGORY (wired to responsive.js click + change + Enter handlers)

export const runAddSubcategory = async (triggerElement) => {
  if (!triggerElement) return null;

  const categoryKey = triggerElement.getAttribute("data-category-key");
  const titleInput = document.getElementById(`new-subcategory-${categoryKey}`);
  if (!categoryKey || !titleInput) return null;

  const title = titleInput.value.trim();
  if (!title) {
    await displayPopup("Please enter a subcategory name", "error");
    return null;
  }

  // Letter is optional; blank means its products keep the category's prefix
  const letterInput = document.getElementById(`new-subcategory-letter-${categoryKey}`);
  let letter = "";
  if (letterInput && letterInput.value.trim()) {
    letter = await normalizeCategoryLetter(letterInput.value);
    if (!letter) return null;
  }

  const data = await sendToBack({ route: "/add-subcategory-route", categoryKey, title, letter });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to add subcategory", "error");
    return null;
  }

  await displayPopup(data.message || "Subcategory added successfully", "success");
  await loadCategories();
  // The add row stays open after the redraw; put the cursor back so the next one can be typed straight away
  document.getElementById(`new-subcategory-${categoryKey}`)?.focus();

  return data;
};

// Opens or closes one category's add-subcategory row; opening puts the cursor in the name box
export const toggleSubcategoryAddRow = (toggleButton) => {
  if (!toggleButton) return null;

  const categoryKey = toggleButton.getAttribute("data-category-key");
  const addRow = document.getElementById(`subcategory-add-row-${categoryKey}`);
  if (!addRow) return null;

  const isOpen = addRow.classList.toggle("hidden") === false;
  setSubcategoryToggleState(toggleButton, isOpen);
  if (isOpen) document.getElementById(`new-subcategory-${categoryKey}`)?.focus();

  return isOpen;
};

// Escape inside an open add row closes it and returns focus to its toggle link
export const closeSubcategoryAddRow = (inputElement) => {
  if (!inputElement) return null;

  const categoryKey = inputElement.getAttribute("data-category-key");
  const addRow = document.getElementById(`subcategory-add-row-${categoryKey}`);
  const toggleButton = document.getElementById(`toggle-subcategory-add-${categoryKey}`);
  if (!addRow || !toggleButton) return null;

  addRow.classList.add("hidden");
  setSubcategoryToggleState(toggleButton, false);
  toggleButton.focus();

  return true;
};

// Same flow as runChangeCategoryLetter, but a blank letter is allowed (falls back to the category's prefix)
export const runChangeSubcategoryLetter = async (inputElement) => {
  if (!inputElement) return null;

  const categoryKey = inputElement.getAttribute("data-category-key");
  const subcategoryKey = inputElement.getAttribute("data-key");
  const title = inputElement.getAttribute("data-title");
  const count = Number(inputElement.getAttribute("data-count")) || 0;
  const oldLetter = inputElement.getAttribute("data-letter") || "";
  const categoryLetter = inputElement.getAttribute("data-category-letter") || "";
  if (!categoryKey || !subcategoryKey) return null;

  let newLetter = "";
  if (inputElement.value.trim()) {
    newLetter = await normalizeCategoryLetter(inputElement.value);
    if (!newLetter) {
      inputElement.value = oldLetter;
      return null;
    }
  }

  inputElement.value = newLetter;
  if (newLetter === oldLetter) return null;

  const oldPrefix = oldLetter || categoryLetter;
  const newPrefix = newLetter || categoryLetter;
  const renumber = oldPrefix !== newPrefix && (await confirmRenameProductCodes(title, count, oldPrefix, newPrefix));

  const data = await sendToBack({ route: "/update-subcategory-letter-route", categoryKey, subcategoryKey, letter: newLetter, renumber });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to change subcategory letter", "error");
    inputElement.value = oldLetter;
    return null;
  }

  await displayPopup(data.message || "Subcategory letter changed", "success");
  await loadCategories();

  return data;
};

export const runRenameSubcategory = async (inputElement) => {
  if (!inputElement) return null;

  const categoryKey = inputElement.getAttribute("data-category-key");
  const subcategoryKey = inputElement.getAttribute("data-key");
  const oldTitle = inputElement.getAttribute("data-title") || "";
  const newTitle = inputElement.value.trim();
  if (!categoryKey || !subcategoryKey) return null;

  if (!newTitle) {
    inputElement.value = oldTitle;
    await displayPopup("Subcategory name cannot be empty", "error");
    return null;
  }
  if (newTitle === oldTitle) {
    inputElement.value = oldTitle;
    return null;
  }

  const data = await sendToBack({ route: "/update-subcategory-title-route", categoryKey, subcategoryKey, title: newTitle });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to rename subcategory", "error");
    inputElement.value = oldTitle;
    return null;
  }

  await displayPopup(data.message || `Subcategory renamed to "${newTitle}"`, "success");
  await loadCategories();

  return data;
};

export const runMoveSubcategory = async (button) => {
  if (!button) return null;

  const categoryKey = button.getAttribute("data-category-key");
  const subcategoryKey = button.getAttribute("data-key");
  const direction = button.getAttribute("data-direction");
  if (!categoryKey || !subcategoryKey) return null;

  const data = await sendToBack({ route: "/move-subcategory-route", categoryKey, subcategoryKey, direction });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to move subcategory", "error");
    return null;
  }

  await loadCategories();

  return data;
};

export const runDeleteSubcategory = async (button) => {
  if (!button) return null;

  const categoryKey = button.getAttribute("data-category-key");
  const subcategoryKey = button.getAttribute("data-key");
  const title = button.getAttribute("data-title");
  if (!categoryKey || !subcategoryKey) return null;

  const confirmMessage = `Delete subcategory "${title}"? Its products are not changed and stay in their category.`;
  const confirmDialog = await displayConfirmDialog(confirmMessage);
  if (!confirmDialog) return null;

  const data = await sendToBack({ route: "/delete-subcategory-route", categoryKey, subcategoryKey });
  if (!data || !data.success) {
    await displayPopup(data?.message || "Failed to delete subcategory", "error");
    return null;
  }

  await displayPopup(data.message || `Subcategory "${title}" deleted successfully`, "success");
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
