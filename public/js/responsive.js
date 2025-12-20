import { runPwToggle, runAuthSubmit, runAddNewProduct, runUploadClick, runUploadPic, runTabClick } from "./run.js";
import { closePopup } from "./util/popup.js";
import { changeAdminProductSelector } from "./helpers/admin-data.js";

const authElement = document.getElementById("auth-element");
const displayElement = document.getElementById("display-element");
const adminElement = document.getElementById("admin-element");

export const clickHandler = async (e) => {
  const clickElement = e.target;
  const clickId = clickElement.id;
  const clickType = clickElement.getAttribute("data-label");
  const tabType = clickElement.getAttribute("data-tab");

  console.log("CLICK HANDLER");
  console.log(clickId);
  console.log("CLICK TYPE");
  console.log(clickType);

  if (clickType === "auth-submit") await runAuthSubmit();
  if (clickType === "upload-click") await runUploadClick();
  if (clickType === "new-product-submit") await runAddNewProduct();
  if (clickType === "popup-close") await closePopup();

  if (clickType === "pwToggle") await runPwToggle();
  // if (clickType === "advancedToggle") await runAdvancedToggle();
  // if (clickType === "make-pretty") await runPrettyToggle(clickId);
  // if (clickType === "copy-return-data") await runCopyReturnData();

  if (tabType) await runTabClick(clickElement);
};

export const keyHandler = async (e) => {
  if (e.key !== "Enter") return null;
  e.preventDefault();

  const keyElement = e.target;
  const keyId = keyElement.id;

  console.log("KEY HANDLER");
  console.log(keyId);

  if (keyId === "auth-pw-input") await runAuthSubmit();

  // if (!displayElement) return null;
  // await runMainSubmit();

  return true;
};

//for file upload
export const changeHandler = async (e) => {
  const changeElement = e.target;
  const changeId = changeElement.id;

  console.log("CHANGE HANDLER");
  console.dir(changeElement);
  console.log("CHANGE ID");
  console.log(changeId);

  if (changeId === "product-selector") await changeAdminProductSelector(changeElement);

  if (changeId !== "upload-pic-input") return null;

  const pic = e.target.files[0];
  // console.log("PIC");
  // console.log(pic);
  if (!pic) return null;

  await runUploadPic(pic);
};

if (authElement) {
  authElement.addEventListener("click", clickHandler);
  authElement.addEventListener("keydown", keyHandler);
}

if (displayElement) {
  displayElement.addEventListener("click", clickHandler);
  displayElement.addEventListener("keydown", keyHandler);
  // displayElement.addEventListener("change", changeHandler);
}

if (adminElement) {
  adminElement.addEventListener("click", clickHandler);
  adminElement.addEventListener("keydown", keyHandler);
  adminElement.addEventListener("change", changeHandler);
}
