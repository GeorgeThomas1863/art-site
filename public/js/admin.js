import { buildAdminForm } from "./forms/admin-form.js";

const adminDisplayElement = document.getElementById("admin-display-element");

export const buildAdminDisplay = async () => {
  if (!adminDisplayElement) return null;
  // const { isFirstLoad } = stateAdmin;

  const adminFormData = await buildAdminForm();
  adminDisplayElement.append(adminFormData);

  //   await updateAdminDisplay();

  return true;
};
