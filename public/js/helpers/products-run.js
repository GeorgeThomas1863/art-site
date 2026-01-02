import { buildProductCard } from "../forms/products-form.js";
// import { addToCart } from "./cart-run.js";

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
  console.log("FILTERING BY CATEGORY:");
  console.log(categoryFilter);

  // Update active button state
  const allFilterButtons = document.querySelectorAll(".products-filter-btn");
  for (let i = 0; i < allFilterButtons.length; i++) {
    allFilterButtons[i].classList.remove("active");
  }
  clickElement.classList.add("active");

  const filteredArray = await filterProducts(productsArray, categoryFilter);

  // Repopulate the grid with filtered products
  const productsGrid = document.getElementById("products-grid");

  if (!productsGrid) {
    console.error("Products grid not found");
    return;
  }

  // Clear existing products
  productsGrid.innerHTML = "";

  // Build and append each filtered product card
  for (let i = 0; i < filteredArray.length; i++) {
    const product = filteredArray[i];
    const productCard = await buildProductCard(product);
    productsGrid.append(productCard);
  }

  return true;
};

// export const changeProductsFilter = async (changeElement) => {
//   if (!changeElement) return null;

//   // const selectedOption = changeElement.options[changeElement.selectedIndex];
//   const categoryFilter = changeElement.value;
//   console.log("FILTERING BY CATEGORY:");
//   console.log(categoryFilter);

//   const filteredArray = await filterProducts(productsArray, categoryFilter);

//   // Repopulate the grid with filtered products
//   const productsGrid = document.getElementById("products-grid");

//   if (!productsGrid) {
//     console.error("Products grid not found");
//     return;
//   }

//   // Clear existing products
//   productsGrid.innerHTML = "";

//   // Build and append each filtered product card
//   for (let i = 0; i < filteredArray.length; i++) {
//     const product = filteredArray[i];
//     const productCard = await buildProductCard(product);
//     productsGrid.append(productCard);
//   }

//   return true;
// };
