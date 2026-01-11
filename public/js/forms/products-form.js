import { formatProductType } from "../helpers/products-run.js";
import { buildCollapseContainer } from "../util/collapse.js";

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

  const filterButtons = document.createElement("div");
  filterButtons.className = "products-filter-buttons";

  const filterOptions = [
    { value: "all", text: "All Products", selected: true },
    { value: "acorns", text: "Acorns" },
    { value: "animals", text: "Animals" },
    { value: "geodes", text: "Geodes" },
    { value: "wallPieces", text: "Wall Pieces" },
    { value: "mountainTreasureBaskets", text: "Mountain Treasure Baskets" },
    { value: "other", text: "Other" },
  ];

  for (let i = 0; i < filterOptions.length; i++) {
    const optionData = filterOptions[i];
    const button = document.createElement("button");
    button.className = "products-filter-btn";
    button.setAttribute("data-label", "category-filter-btn");
    button.setAttribute("data-category", optionData.value);
    button.textContent = optionData.text;

    if (optionData.selected) {
      button.classList.add("active");
    }
    filterButtons.append(button);
  }

  // filterBar.append(filterLabel, filterButtons);
  filterBar.append(filterButtons);

  return filterBar;
};

//---------------------

export const buildCategoryDescription = async (category) => {
  const descriptionObj = categoryDescriptions[category];
  if (!descriptionObj) return null;

  const titleElement = document.createElement("h3");
  titleElement.textContent = `${descriptionObj.title}`;
  titleElement.className = "category-description-title";

  const contentElement = document.createElement("div");
  contentElement.textContent = descriptionObj.details;
  contentElement.className = "category-description-text";

  // Build collapse container
  const collapseContainer = await buildCollapseContainer({
    titleElement: titleElement,
    contentElement: contentElement,
    isExpanded: true, // Start expanded
    className: "category-description-container",
  });

  return collapseContainer;
};

//---------------------------------

// Build the products grid container
export const buildProductsGrid = async () => {
  const productsGrid = document.createElement("div");
  productsGrid.className = "products-grid";
  productsGrid.id = "products-grid";

  return productsGrid;
};

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

//----------------------

export const categoryDescriptions = {
  all: {
    title: "Our Products",
    details: `Handmade with love from wool and other natural materials, each product has a unique story and a special place in our hearts.
    
Click on the categories to learn more.`,
  },

  acorns: {
    title: "Acorns",
    details: `The acorn ornaments are created using acorn caps from the Bur Oak tree. The Bur Oak produces the largest acorns in North America. These trees can be found in many states and are very adaptable to soil and weather conditions. They are very hardy and live for centuries.  Bur Oak trees provide food and shelter to many species of wildlife.

We are always on the search for other types of acorn caps which we use for our smaller felted acorns, jewelry, and other creations.
    
We have wonderful customers, family and friends who also gather acorn caps for us, it does take a village and we are so grateful to be a part of it.
`,
  },

  animals: {
    title: "Funky Fun Animals!",
    details: `These whimsical creatures are designed to bring joy to all who see them.

The animals are created with natural fleece, wool roving, wool locks and twists along with other embelishments.
`,
  },
  geodes: {
    title: "Geodes - Stones with a secret!!!",
    details: `Revered by many as a connection with the earth's energy. Representing strength, hidden potential, and positive energy flow.

We create our geodes with both wet felting and dry needle felting. Our geodes emerge from multiple layers created by these two methods. Once the exterior is complete the interior beauty emerges by using crystals carefully placed and enhanced with complimentary gemstones, vintage beads and more.
`,
  },
  wallPieces: {
    title: "Matted original art",
    details: `For those who like to use their frames we have available 5 by 7 inch needle felted scenes. These are matted to 8 by 10 inches.

These one of a kind scenes are created using wool, sari silk, throwsters waste, and other assorted fibers.
`,
  },
  mountainTreasureBaskets: {
    title: "Mountain Treasures Baskets",
    details: `Created in the South Toe Valley of the Black Mountains of North Carolina using wool and natural fibers, these baskets are a beautiful way to display your treasures.

I select colors representing what I have found on the forest floor, along the rivers, and in the meadows.

Rich greens from the Rhododendrons, pine trees and moss. Sprinkle in wildflowers of yellow, blue, and pink. Browns from the earth, tree bark and mushrooms. Shades of gray from the rocks. Sparkles of the rainbow from the Mica and gemstones.

In each basket you will find the treasure of written words, strung together invoking a message of beauty and inspiration.
`,
  },

  other: `Other

If you don't see what you are looking for, please contact us and we will see if we can create something special for you.
`,
};
