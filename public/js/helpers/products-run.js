import { buildProductCard, buildCategoryDescription, buildProductDetailModal } from "../forms/products-form.js";

//store locally for filtering
let productsArray = [];

// Populate the products grid with product cards
export const populateProducts = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  productsArray = inputArray;

  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  // Clear existing products
  productsGrid.innerHTML = "";

  // Build and append each product card
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    const productCard = await buildProductCard(product);
    productsGrid.append(productCard);
  }
};

// Filter products by category
export const filterProducts = async (inputArray, category) => {
  if (category === "all") {
    return inputArray;
  }

  const filteredProducts = [];
  for (let i = 0; i < inputArray.length; i++) {
    const product = inputArray[i];
    if (product.productType === category) {
      filteredProducts.push(product);
    }
  }

  return filteredProducts;
};

// Helper function to format product type from camelCase to readable text
export const formatProductType = async (productType) => {
  if (!productType) return null;

  // Handle special cases
  const specialCases = {
    mountainTreasureBaskets: "Mountain Treasure Baskets",
    wallPieces: "Wall Pieces",
    gnomeHouses: "Gnome Houses",
  };

  if (specialCases[productType]) {
    return specialCases[productType];
  }

  // Default: capitalize first letter
  return productType.charAt(0).toUpperCase() + productType.slice(1);
};

//----------------------------

export const changeProductsFilterButton = async (clickElement) => {
  if (!clickElement) return null;

  const categoryFilter = clickElement.getAttribute("data-category");
  // console.log("FILTERING BY CATEGORY:");
  // console.log(categoryFilter);

  // Update active button state
  const allFilterButtons = document.querySelectorAll(".products-filter-btn");
  for (let i = 0; i < allFilterButtons.length; i++) {
    allFilterButtons[i].classList.remove("active");
  }
  clickElement.classList.add("active");

  const filteredArray = await filterProducts(productsArray, categoryFilter);

  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  productsGrid.innerHTML = "";

  // Build and append each filtered product card
  for (let i = 0; i < filteredArray.length; i++) {
    const product = filteredArray[i];
    const productCard = await buildProductCard(product);
    productsGrid.append(productCard);
  }

  await updateCategoryDescription(categoryFilter);

  return true;
};

export const updateCategoryDescription = async (category) => {
  // Remove existing description if present
  const existingDescription = document.querySelector(".category-description-container");
  if (existingDescription) existingDescription.remove();

  // Build new description for this category
  const newDescription = await buildCategoryDescription(category);
  if (!newDescription) return null;

  const filterBar = document.querySelector(".products-filter-bar");
  if (filterBar) filterBar.insertAdjacentElement("afterend", newDescription);

  return true;
};

// Open product detail modal
export const openProductDetailModal = async (clickElement) => {
  const card = clickElement.closest(".product-card");
  if (!card) return null;

  const productId = card.getAttribute("data-product-id");
  const productData = productsArray.find((p) => String(p.productId) === String(productId));
  if (!productData) return null;

  const modal = await buildProductDetailModal(productData);
  const productsElement = document.getElementById("products-element");
  productsElement.append(modal);

  // Trigger reflow then add visible class for animation
  requestAnimationFrame(() => modal.classList.add("visible"));
};

// Close product detail modal
export const closeProductDetailModal = async () => {
  const modal = document.querySelector(".product-detail-overlay");
  if (modal) modal.remove();
};
