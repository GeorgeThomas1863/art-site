import { formatProductType } from "../helpers/products-run.js";

// Build the entire products page
export const buildProductsForm = async () => {
  const productsContainer = document.createElement("div");
  productsContainer.className = "products-container";

  const pageHeader = await buildProductsPageHeader();
  const filterBar = await buildProductsFilterBar();
  const productsGrid = await buildProductsGrid();

  productsContainer.append(pageHeader, filterBar, productsGrid);

  return productsContainer;
};

// Build page header with title and subtitle
export const buildProductsPageHeader = async () => {
  const pageHeader = document.createElement("div");
  pageHeader.className = "products-page-header";

  const pageTitle = document.createElement("h1");
  pageTitle.className = "products-page-title";
  pageTitle.textContent = "Our Collection";

  const pageSubtitle = document.createElement("p");
  pageSubtitle.className = "products-page-subtitle";
  pageSubtitle.textContent = "Handcrafted with love and natural materials";

  pageHeader.append(pageTitle, pageSubtitle);

  return pageHeader;
};

// Build filter bar with category dropdown
export const buildProductsFilterBar = async () => {
  const filterBar = document.createElement("div");
  filterBar.className = "products-filter-bar";

  const filterLabel = document.createElement("label");
  filterLabel.className = "products-filter-label";
  filterLabel.textContent = "Filter by Category:";
  filterLabel.setAttribute("for", "category-filter");

  const filterSelect = document.createElement("select");
  filterSelect.className = "products-filter-select";
  filterSelect.id = "category-filter";
  filterSelect.name = "category-filter";

  const filterOptions = [
    { value: "all", text: "All Products", selected: true },
    { value: "acorns", text: "Acorns" },
    { value: "animals", text: "Animals" },
    { value: "geodes", text: "Geodes" },
    { value: "wallPieces", text: "Wall Pieces" },
    { value: "mountainTreasureBaskets", text: "Mountain Treasure Baskets" },
  ];

  for (let i = 0; i < filterOptions.length; i++) {
    const optionData = filterOptions[i];
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.text;
    if (optionData.selected) {
      option.selected = true;
    }
    filterSelect.append(option);
  }

  filterBar.append(filterLabel, filterSelect);

  return filterBar;
};

// Build the products grid container
export const buildProductsGrid = async () => {
  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";
  productsGrid.id = "products-grid";

  return productsGrid;
};

//---------------------------------

// Build individual product card
export const buildProductCard = async (productData) => {
  const productCard = document.createElement("div");
  productCard.className = "product-card";
  productCard.setAttribute("data-product-id", productData.productId);
  productCard.setAttribute("data-product-type", productData.productType);

  const productImage = await buildProductImage(productData);
  const productInfo = await buildProductInfo(productData);

  productCard.append(productImage, productInfo);

  return productCard;
};

// Build product image element
export const buildProductImage = async (productData) => {
  const { picData } = productData;
  if (!picData) return null;

  const productImage = document.createElement("img");
  productImage.className = "product-image";
  productImage.alt = productData.name;

  const picPath = `/images/products/${picData.filename}`;
  if (!picPath) return null;

  productImage.src = picPath;

  return productImage;
};

// Build product info section (name, price, description, footer)
export const buildProductInfo = async (productData) => {
  const productInfo = document.createElement("div");
  productInfo.className = "product-info";

  const productHeader = await buildProductHeader(productData);
  const productName = await buildProductName(productData);
  const productPrice = await buildProductPrice(productData);
  const productDescription = await buildProductDescription(productData);
  const productType = await buildProductTypeBadge(productData);

  productInfo.append(productHeader, productName, productPrice, productDescription, productType);

  return productInfo;
};

export const buildProductHeader = async (productData) => {
  const productHeader = document.createElement("div");
  productHeader.className = "product-header";

  const addToCartBtn = await buildAddToCartButton(productData);

  productHeader.append(addToCartBtn);

  return productHeader;
};

export const buildAddToCartButton = async (productData) => {
  const addToCartBtn = document.createElement("button");
  addToCartBtn.className = "add-to-cart-btn";
  addToCartBtn.textContent = "Add to Cart";
  addToCartBtn.productId = productData.productId;
  addToCartBtn.setAttribute("data-label", "add-to-cart");

  return addToCartBtn;
};

// Build product name
export const buildProductName = async (productData) => {
  const productName = document.createElement("h2");
  productName.className = "product-name";
  productName.textContent = productData.name;

  return productName;
};

// Build product price
export const buildProductPrice = async (productData) => {
  const productPrice = document.createElement("div");
  productPrice.className = "product-price";
  productPrice.textContent = `$${productData.price}`;

  return productPrice;
};

// Build product description
export const buildProductDescription = async (productData) => {
  const productDescription = document.createElement("p");
  productDescription.className = "product-description";
  productDescription.textContent = productData.description;

  return productDescription;
};

// Build product type badge
export const buildProductTypeBadge = async (productData) => {
  const productType = document.createElement("span");
  productType.className = "product-type";

  // Convert camelCase to readable format
  const typeText = await formatProductType(productData.productType);
  productType.textContent = typeText;

  return productType;
};

// // Build product footer with type badge and add to cart button
// export const buildProductHeader = async (productData) => {
//   const productHeader = document.createElement("div");
//   productHeader.className = "product-header";

//   const productType = await buildProductTypeBadge(productData);
//   const addToCartBtn = await buildAddToCartButton(productData);

//   productHeader.append(productType, addToCartBtn);

//   return productHeader;
// };
