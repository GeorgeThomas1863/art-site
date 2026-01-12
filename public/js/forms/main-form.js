// Main function to build and render the photography site
export const buildMainForm = async () => {
  // if (!inputArray || !inputArray.length) return null;

  const mainContainer = document.createElement("div");
  mainContainer.id = "main-container";

  // Clear the container
  mainContainer.innerHTML = "";

  // Create navigation
  const navElement = await buildNavBar();
  const contentSection = await buildContentSection();
  mainContainer.append(navElement, contentSection);

  return mainContainer;
};

// Create navigation bar
export const buildNavBar = async () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const navContainer = document.createElement("div");
  navContainer.className = "nav-container";

  const logo = document.createElement("a");
  logo.className = "logo";
  logo.textContent = "Two Sisters Fiber Art";
  logo.href = "/";

  const ul = document.createElement("ul");
  ul.className = "nav-links";

  const navItems = [
    // { text: "Welcome", href: "/" }, //not needed
    { text: "Products", href: "/products" },
    { text: "About", href: "/about" },
    { text: "Events", href: "/events" },
  ];

  for (let i = 0; i < navItems.length; i++) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = navItems[i].href;
    a.textContent = navItems[i].text;
    li.appendChild(a);
    ul.appendChild(li);
  }

  // Add cart button
  const cartLi = document.createElement("li");
  cartLi.id = "nav-cart-container";
  cartLi.style.display = "none"; // Hidden by default

  const cartLink = document.createElement("a");
  cartLink.href = "/cart";
  cartLink.className = "nav-cart-link";

  const cartIcon = document.createElement("span");
  cartIcon.className = "cart-icon";
  cartIcon.textContent = "🛒";

  const cartCount = document.createElement("span");
  cartCount.className = "cart-count";
  cartCount.id = "nav-cart-count";
  cartCount.textContent = "0";

  cartLink.append(cartIcon, cartCount);
  cartLi.appendChild(cartLink);
  ul.appendChild(cartLi);

  navContainer.appendChild(logo);
  navContainer.appendChild(ul);
  nav.appendChild(navContainer);

  return nav;
};

// Build the entire landing page
export const buildContentSection = async () => {
  const contentContainer = document.createElement("div");
  contentContainer.className = "content-container";

  const splitHero = await buildSplitHero();
  // const infoBar = await buildInfoBar();

  // contentContainer.append(splitHero, infoBar);
  contentContainer.append(splitHero);

  return contentContainer;
};

// Build split hero section
export const buildSplitHero = async () => {
  const splitHero = document.createElement("div");
  splitHero.className = "split-hero";

  const splitContent = await buildSplitContent();
  const splitImage = await buildSplitImage();

  splitHero.append(splitContent, splitImage);

  return splitHero;
};

// Build content section (left side)
export const buildSplitContent = async () => {
  const splitContent = document.createElement("div");
  splitContent.className = "split-content";

  const splitTitle = await buildSplitTitle();
  const splitText = await buildSplitText();
  const splitButtons = await buildSplitButtons();

  splitContent.append(splitTitle, splitText, splitButtons);

  return splitContent;
};

// Build title
export const buildSplitTitle = async () => {
  const splitTitle = document.createElement("h1");
  splitTitle.className = "split-title";
  splitTitle.textContent = "Where Nature Meets Artistry";

  return splitTitle;
};

// Build text
export const buildSplitText = async () => {
  const splitText = document.createElement("p");
  splitText.className = "split-text";
  splitText.textContent =
    "Creating beautiful fiber art pieces from natural materials. Each piece tells a story of craftsmanship, sustainability, and timeless beauty.";

  return splitText;
};

// Build CTA button
export const buildSplitButtons = async () => {
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "split-buttons";

  const shopBtn = document.createElement("a");
  shopBtn.className = "split-cta split-cta-primary";
  shopBtn.textContent = "Shop Now";
  shopBtn.href = "/products";

  const storyBtn = document.createElement("a");
  storyBtn.className = "split-cta split-cta-secondary";
  storyBtn.textContent = "Our Story";
  storyBtn.href = "/about";

  buttonsContainer.append(shopBtn, storyBtn);

  return buttonsContainer;
};

// Build image section (right side)
export const buildSplitImage = async () => {
  const splitImage = document.createElement("div");
  splitImage.className = "split-image";

  // Top rotating section with 2 images
  const rotatingLeft = document.createElement("a");
  rotatingLeft.className = "split-image-rotating";
  rotatingLeft.id = "split-image-left";
  rotatingLeft.href = "/products";

  const rotatingLeftText = document.createElement("div");
  rotatingLeftText.className = "split-image-text";
  rotatingLeftText.textContent = "Unique Products";
  rotatingLeft.appendChild(rotatingLeftText);

  const rotatingRight = document.createElement("a");
  rotatingRight.className = "split-image-rotating";
  rotatingRight.id = "split-image-right";
  rotatingRight.href = "/products";

  const rotatingRightText = document.createElement("div");
  rotatingRightText.className = "split-image-text";
  rotatingRightText.textContent = "Natural Materials";
  rotatingRight.appendChild(rotatingRightText);

  splitImage.append(rotatingLeft, rotatingRight);

  return splitImage;
};
