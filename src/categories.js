import dbModel from "../models/db-model.js";

const CATEGORIES_COLLECTION = () => process.env.CATEGORIES_COLLECTION || "categories";

// A category is any title the admin chose plus a 1-3 letter admin-chosen prefix that prefixes
// auto-assigned product codes. Letters are NOT unique across categories — two categories may share
// one (and therefore share a running number sequence). `key` is the camelCase productType.
export const DEFAULT_CATEGORIES = [
  { key: "acorns", title: "Acorns", letter: "A" },
  { key: "animals", title: "Animals", letter: "F" }, // "Funky Fun Animals"
  { key: "geodes", title: "Geodes", letter: "G" },
  { key: "wallPieces", title: "Wall Pieces", letter: "W" },
  { key: "mountainTreasureBaskets", title: "Mountain Treasure Baskets", letter: "M" },
  { key: "gnomeHouses", title: "Gnome Houses", letter: "H" },
  { key: "other", title: "Other", letter: "O" },
];

//---------- key + letter building ----------

export const buildCategoryKey = (title) => {
  if (!title) return null;

  const cleaned = String(title).replace(/[^a-zA-Z0-9\s]/g, "");
  const rawWords = cleaned.trim().split(/\s+/);
  const words = [];
  for (let i = 0; i < rawWords.length; i++) {
    if (rawWords[i].length > 0) words.push(rawWords[i]);
  }
  if (!words.length) return null;

  let key = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (i === 0) {
      key += word.toLowerCase();
    } else {
      key += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  }

  return key || null;
};

export const normalizeLetter = (letter) => {
  const upperLetter = String(letter ?? "").trim().toUpperCase();
  if (!/^[A-Z]{1,3}$/.test(upperLetter)) return null;

  return upperLetter;
};

//---------- read ----------

export const getCategories = async () => {
  try {
    const dataModel = new dbModel("", CATEGORIES_COLLECTION());
    const existing = await dataModel.getAll();
    if (!existing) return null;
    if (existing.length > 0) return existing;

    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const seedParams = { ...DEFAULT_CATEGORIES[i], dateCreated: new Date().toISOString() };
      const seedModel = new dbModel(seedParams, CATEGORIES_COLLECTION());
      await seedModel.storeAny();
    }

    const seededModel = new dbModel("", CATEGORIES_COLLECTION());
    const seeded = await seededModel.getAll();
    return seeded || null;
  } catch (error) {
    console.error("getCategories error:", error);
    return null;
  }
};

export const buildCategoryList = async () => {
  try {
    const categories = await getCategories();
    if (!categories) return null;

    const productModel = new dbModel("", process.env.PRODUCTS_COLLECTION);
    let products = await productModel.getAll();
    if (!products) products = [];

    const countsByType = {};
    for (let i = 0; i < products.length; i++) {
      const productType = products[i].productType;
      countsByType[productType] = (countsByType[productType] || 0) + 1;
    }

    const list = [];
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const productCount = countsByType[category.key] || 0;
      list.push({ key: category.key, title: category.title, letter: category.letter, productCount });
    }

    return list;
  } catch (error) {
    console.error("buildCategoryList error:", error);
    return null;
  }
};

export const findCategory = async (productType) => {
  try {
    if (!productType) return null;

    const categories = await getCategories();
    if (!categories) return null;

    for (let i = 0; i < categories.length; i++) {
      if (categories[i].key === productType) return categories[i];
    }

    return null;
  } catch (error) {
    console.error("findCategory error:", error);
    return null;
  }
};

//---------- write ----------

export const addCategory = async (inputParams) => {
  try {
    const { title, letter } = inputParams || {};

    const trimmedTitle = String(title ?? "").trim();
    if (!trimmedTitle) return { success: false, message: "Title is required" };
    if (trimmedTitle.length > 60) return { success: false, message: "Title must be 60 characters or fewer" };

    const key = buildCategoryKey(trimmedTitle);
    if (!key) return { success: false, message: "Title must contain at least one letter or number" };
    if (key === "all") return { success: false, message: 'Category name "all" is reserved' };

    const upperLetter = normalizeLetter(letter);
    if (!upperLetter) return { success: false, message: "Letter must be 1-3 letters A-Z" };

    const categories = await getCategories();
    if (!categories) return { success: false, message: "Failed to load categories" };

    for (let i = 0; i < categories.length; i++) {
      if (categories[i].key === key) return { success: false, message: "Category already exists" };
    }

    const newCategory = { key, title: trimmedTitle, letter: upperLetter, dateCreated: new Date().toISOString() };
    const storeModel = new dbModel(newCategory, CATEGORIES_COLLECTION());
    const storeData = await storeModel.storeAny();
    if (!storeData) return { success: false, message: "Failed to store category" };

    return { success: true, message: "Category added successfully", category: newCategory };
  } catch (error) {
    console.error("addCategory error:", error);
    return { success: false, message: "Failed to add category" };
  }
};

// Renames a category's display title only. The key (what products store as productType)
// never changes, so existing products keep pointing at the same category.
export const updateCategoryTitle = async (inputParams) => {
  try {
    const { key, title } = inputParams || {};
    if (!key) return { success: false, message: "No category key provided" };

    const trimmedTitle = String(title ?? "").trim();
    if (!trimmedTitle) return { success: false, message: "Title is required" };
    if (trimmedTitle.length > 60) return { success: false, message: "Title must be 60 characters or fewer" };

    const lookupParams = { keyToLookup: "key", itemValue: key };
    const checkModel = new dbModel(lookupParams, CATEGORIES_COLLECTION());
    const category = await checkModel.getUniqueItem();
    if (!category) return { success: false, message: "Category not found" };

    if (category.title === trimmedTitle) return { success: true, message: "Title unchanged", title: trimmedTitle };

    const updateParams = { ...lookupParams, updateObj: { title: trimmedTitle } };
    const updateModel = new dbModel(updateParams, CATEGORIES_COLLECTION());
    const updateData = await updateModel.updateObjItem();
    if (!updateData) return { success: false, message: "Failed to update category title" };

    return { success: true, message: `Category renamed to "${trimmedTitle}"`, title: trimmedTitle };
  } catch (error) {
    console.error("updateCategoryTitle error:", error);
    return { success: false, message: "Failed to update category title" };
  }
};

// Changes a category's letter. With `renumber`, every product in that category whose product code
// is <OLD><digits> becomes <NEW><digits> (number kept); custom product codes are left alone.
export const updateCategoryLetter = async (inputParams) => {
  try {
    const { key, letter, renumber } = inputParams || {};
    if (!key) return { success: false, message: "No category key provided" };

    const newLetter = normalizeLetter(letter);
    if (!newLetter) return { success: false, message: "Letter must be 1-3 letters A-Z" };

    const lookupParams = { keyToLookup: "key", itemValue: key };
    const checkModel = new dbModel(lookupParams, CATEGORIES_COLLECTION());
    const category = await checkModel.getUniqueItem();
    if (!category) return { success: false, message: "Category not found" };

    const oldLetter = normalizeLetter(category.letter);
    if (oldLetter === newLetter) return { success: true, message: "Letter unchanged", letter: newLetter, renamedCount: 0 };

    // Rename product codes BEFORE persisting the new letter: a failed rename leaves the category
    // on the old letter, so retrying the same change resumes instead of hitting "Letter unchanged".
    let renamedCount = 0;
    if (renumber) {
      renamedCount = await renameCategoryProductCodes(key, oldLetter, newLetter);
      if (renamedCount === null) {
        return { success: false, message: "Failed to rename product codes; letter not changed" };
      }
    }

    const updateParams = { ...lookupParams, updateObj: { letter: newLetter } };
    const updateModel = new dbModel(updateParams, CATEGORIES_COLLECTION());
    const updateData = await updateModel.updateObjItem();
    if (!updateData) {
      if (renamedCount > 0) {
        return { success: false, message: `${renamedCount} product code${renamedCount === 1 ? "" : "s"} renamed, but failed to update category letter` };
      }
      return { success: false, message: "Failed to update category letter" };
    }

    if (!renumber) return { success: true, message: `Letter changed to ${newLetter}`, letter: newLetter, renamedCount: 0 };

    const message = `Letter changed to ${newLetter}; ${renamedCount} product code${renamedCount === 1 ? "" : "s"} renamed`;
    return { success: true, message, letter: newLetter, renamedCount };
  } catch (error) {
    console.error("updateCategoryLetter error:", error);
    return { success: false, message: "Failed to update category letter" };
  }
};

const renameCategoryProductCodes = async (productType, oldLetter, newLetter) => {
  try {
    if (!oldLetter) return 0;

    const productModel = new dbModel("", process.env.PRODUCTS_COLLECTION);
    const products = await productModel.getAll();
    if (!products) return null;

    const existingProductCodes = new Set();
    for (let i = 0; i < products.length; i++) {
      if (typeof products[i].productCode !== "string") continue;
      existingProductCodes.add(products[i].productCode.toUpperCase());
    }

    const pattern = new RegExp(`^${oldLetter}(\\d+)$`, "i");
    let renamedCount = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (product.productType !== productType) continue;
      if (typeof product.productCode !== "string") continue;
      const match = product.productCode.match(pattern);
      if (!match) continue;

      let nextNumber = parseInt(match[1], 10);
      let nextProductCode = newLetter + match[1];
      while (existingProductCodes.has(nextProductCode.toUpperCase()) && nextProductCode.toUpperCase() !== product.productCode.toUpperCase()) {
        nextNumber++;
        nextProductCode = newLetter + String(nextNumber).padStart(3, "0");
      }
      existingProductCodes.add(nextProductCode.toUpperCase());

      const renameParams = {
        keyToLookup: "productId",
        itemValue: product.productId,
        updateObj: { productCode: nextProductCode },
      };
      const renameModel = new dbModel(renameParams, process.env.PRODUCTS_COLLECTION);
      const renameData = await renameModel.updateObjItem();
      if (!renameData?.matchedCount) continue; // product vanished mid-loop — nothing renamed, don't count it
      renamedCount++;
    }

    return renamedCount;
  } catch (error) {
    console.error("renameCategoryProductCodes error:", error);
    return null;
  }
};

export const deleteCategory = async (key) => {
  try {
    if (!key) return { success: false, message: "No category key provided" };

    const params = { keyToLookup: "key", itemValue: key };
    const checkModel = new dbModel(params, CATEGORIES_COLLECTION());
    const checkData = await checkModel.getUniqueItem();
    if (!checkData) return { success: false, message: "Category not found" };

    const deleteModel = new dbModel(params, CATEGORIES_COLLECTION());
    const deleteData = await deleteModel.deleteItem();
    if (!deleteData) return { success: false, message: "Failed to delete category" };

    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("deleteCategory error:", error);
    return { success: false, message: "Failed to delete category" };
  }
};

//---------- product code generation ----------

export const buildNextProductCode = async (productType) => {
  try {
    const category = await findCategory(productType);
    if (!category) return null;

    const productModel = new dbModel("", process.env.PRODUCTS_COLLECTION);
    const products = await productModel.getAll();
    if (!products) return null;

    return buildNextProductCodeFromProducts(productType, [category], products);
  } catch (error) {
    console.error("buildNextProductCode error:", error);
    return null;
  }
};

export const buildNextProductCodeFromProducts = (productType, categories, products) => {
  const category = findCategoryInList(productType, categories);
  if (!category) return null;

  const prefix = normalizeLetter(category.letter);
  if (!prefix) return null;

  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  let maxNumber = 0;
  for (let i = 0; i < products.length; i++) {
    const productCode = products[i].productCode;
    if (typeof productCode !== "string") continue;
    const match = productCode.match(pattern);
    if (!match) continue;
    const numeric = parseInt(match[1], 10);
    if (numeric > maxNumber) maxNumber = numeric;
  }

  const nextNumber = maxNumber + 1;
  return prefix + String(nextNumber).padStart(3, "0");
};

const findCategoryInList = (productType, categories) => {
  if (!productType || !Array.isArray(categories)) return null;

  for (let index = 0; index < categories.length; index++) {
    if (categories[index].key === productType) return categories[index];
  }

  return null;
};

export const findProductCodeOwner = async (productCode, excludeProductId) => {
  try {
    const trimmedProductCode = String(productCode ?? "").trim();
    if (!trimmedProductCode) return null;

    const productModel = new dbModel("", process.env.PRODUCTS_COLLECTION);
    const products = await productModel.getAll();
    if (!products) return null;

    const upperProductCode = trimmedProductCode.toUpperCase();
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (product.productId === excludeProductId) continue;
      const productProductCode = String(product.productCode ?? "").trim().toUpperCase();
      if (productProductCode !== upperProductCode) continue;
      return product;
    }

    return null;
  } catch (error) {
    console.error("findProductCodeOwner error:", error);
    return null;
  }
};
