export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("ul");
  adminFormWrapper.id = "admin-form-wrapper";

  //build FORM list items
  const adminTitleListItem = await buildAdminTitleListItem();
  const adminButtonListItem = await buildAdminButtonListItem();

  adminFormWrapper.append(adminTitleListItem, adminButtonListItem);

  return adminFormWrapper;
};

export const buildAdminTitleListItem = async () => {
  const adminTitleListItem = document.createElement("li");
  adminTitleListItem.id = "admin-title-list-item";

  //FIX
  const adminTitle = document.createElement("h1");
  adminTitle.id = "admin-title";
  adminTitle.textContent = "ADMIN SECTION";

  adminTitleListItem.append(adminTitle);

  return adminTitleListItem;
};

export const buildAdminButtonListItem = async () => {
  const adminButtonListItem = document.createElement("li");
  adminButtonListItem.id = "admin-button-list-item";

  const adminButton = document.createElement("button");
  adminButton.id = "admin-button";
  adminButton.className = "btn-submit";
  adminButton.textContent = "SUBMIT";

  adminButtonListItem.append(adminButton);

  return adminButtonListItem;
};
