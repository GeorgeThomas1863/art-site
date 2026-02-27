export const buildNewsletterForm = () => {
  const container = document.createElement("div");
  container.className = "newsletter-container";

  const header = buildNewsletterHeader();
  const controls = buildNewsletterControls();
  const displayArea = buildNewsletterDisplayArea();

  container.append(header, controls, displayArea);
  return container;
};

const buildNewsletterHeader = () => {
  const header = document.createElement("div");
  header.className = "newsletter-page-header";

  const title = document.createElement("h1");
  title.className = "newsletter-page-title";
  title.textContent = "Newsletter Archive";

  header.append(title);
  return header;
};

const buildNewsletterControls = () => {
  const controls = document.createElement("div");
  controls.className = "newsletter-controls hidden";
  controls.id = "newsletter-controls";

  const label = document.createElement("label");
  label.className = "newsletter-select-label";
  label.setAttribute("for", "newsletter-select");
  label.textContent = "Select Newsletter:";

  const select = document.createElement("select");
  select.className = "newsletter-select";
  select.id = "newsletter-select";
  select.setAttribute("data-label", "newsletter-select");

  controls.append(label, select);
  return controls;
};

const buildNewsletterDisplayArea = () => {
  const area = document.createElement("div");
  area.className = "newsletter-display-area";
  area.id = "newsletter-display-area";
  return area;
};
