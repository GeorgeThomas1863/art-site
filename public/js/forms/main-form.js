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
  const infoBar = await buildInfoBar();

  contentContainer.append(splitHero, infoBar);

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
  const splitCta = await buildSplitCta();

  splitContent.append(splitTitle, splitText, splitCta);

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
export const buildSplitCta = async () => {
  const splitCta = document.createElement("a");
  splitCta.className = "split-cta";
  splitCta.textContent = "Shop Now";
  splitCta.href = "/products";

  return splitCta;
};

// Build image section (right side)
export const buildSplitImage = async () => {
  const splitImage = document.createElement("div");
  splitImage.className = "split-image";
  splitImage.id = "split-image";

  return splitImage;
};

// Build info bar
export const buildInfoBar = async () => {
  const infoBar = document.createElement("div");
  infoBar.className = "info-bar";

  const infoBarText = document.createElement("p");
  infoBarText.className = "info-bar-text";
  infoBarText.textContent = "Handcrafted • Sustainable • Unique";

  infoBar.append(infoBarText);

  return infoBar;
};
