import { buildAuthForm } from "./forms/auth-form.js";

const authElement = document.getElementById("auth-element");
console.log("AUTH ELEMENT");
console.log(authElement);

export const buildAuthDisplay = async () => {
  if (!authElement) return null;

  const authForm = await buildAuthForm();
  if (!authForm) {
    console.log("FAILED TO BUILD AUTH FORM");
    return null;
  }

  authElement.appendChild(authForm);
};

buildAuthDisplay();
