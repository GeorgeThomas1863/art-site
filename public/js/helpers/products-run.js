import { buildProductCard } from "../forms/products-form.js";

// Populate the products grid with product cards
export const populateProductsGrid = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

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
export const filterProducts = async (productsArray, category) => {
  if (category === "all") {
    return productsArray;
  }

  const filteredProducts = [];
  for (let i = 0; i < productsArray.length; i++) {
    const product = productsArray[i];
    if (product.productType === category) {
      filteredProducts.push(product);
    }
  }

  return filteredProducts;
};

// Helper function to format product type from camelCase to readable text
export const formatProductType = (productType) => {
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
