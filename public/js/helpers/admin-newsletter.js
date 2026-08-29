// import { sendToBack } from "../util/api-front.js";
// import { displayPopup, displayConfirmDialog } from "../util/popup.js";
// import { updateSubscriberStats } from "./admin-run.js";

// // Send newsletter
// export const runSendNewsletter = async () => {
//   const subject = document.getElementById("newsletter-subject");
//   const message = document.getElementById("newsletter-message");

//   if (!message || !message.value.trim()) {
//     await displayPopup("Please enter a message", "error");
//     return null;
//   }

//   const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
//   const subscriberCount = subscriberData ? subscriberData.length : 0;
//   const confirmMessage = `Are you sure you want to send this newsletter to your ${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}?`;
//   const confirmDialog = await displayConfirmDialog(confirmMessage);

//   if (!confirmDialog) return null;

//   const newsletterParams = {
//     route: "/newsletter/send",
//     subject: subject.value.trim(),
//     message: message.value.trim(),
//   };

//   // console.log("SEND NEWSLETTER PARAMS");
//   // console.dir(newsletterParams);

//   const data = await sendToBack(newsletterParams);
//   if (!data || !data.success) {
//     await displayPopup("Failed to send newsletter", "error");
//     return null;
//   }

//   // console.log("SEND NEWSLETTER DATA");
//   // console.dir(data);

//   await displayPopup("Newsletter sent successfully", "success");

//   // Remove modal
//   const modal = document.querySelector(".modal-overlay");
//   if (modal) modal.remove();

//   return data;
// };

// // Add subscriber
// export const runAddSubscriber = async () => {
//   const emailInput = document.getElementById("new-subscriber-email");

//   if (!emailInput || !emailInput.value.trim()) {
//     await displayPopup("Please enter an email address", "error");
//     return null;
//   }

//   const email = emailInput.value.trim();

//   // Basic email validation
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     await displayPopup("Please enter a valid email address", "error");
//     return null;
//   }

//   const subscriberParams = {
//     route: "/newsletter/add",
//     email: email,
//   };

//   // console.log("ADD SUBSCRIBER PARAMS");
//   // console.dir(subscriberParams);

//   const data = await sendToBack(subscriberParams);
//   if (!data || !data.success) {
//     await displayPopup("Failed to add subscriber", "error");
//     return null;
//   }

//   if (data.duplicate) {
//     await displayPopup(`${email} is already subscribed`, "error");
//     return null;
//   }

//   await displayPopup(`Added ${email} to mailing list`, "success");

//   // Clear input
//   emailInput.value = "";

//   // Refresh subscriber list
//   const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
//   // console.log("SUBSCRIBER DATA");
//   // console.dir(subscriberData);
//   if (subscriberData) {
//     await populateSubscriberList(subscriberData);
//     await updateSubscriberStats(subscriberData);
//   }

//   return data;
// };

// // Remove subscriber
// export const runRemoveSubscriber = async (clickElement) => {
//   if (!clickElement) return null;

//   const email = clickElement.getAttribute("data-email");
//   if (!email) return null;

//   const confirmMessage = `Are you sure you want to remove ${email} from the mailing list?`;
//   const confirmDialog = await displayConfirmDialog(confirmMessage);

//   if (!confirmDialog) return null;

//   const removeParams = {
//     route: "/newsletter/remove",
//     email: email,
//   };

//   // console.log("REMOVE SUBSCRIBER PARAMS");
//   // console.dir(removeParams);

//   const data = await sendToBack(removeParams);
//   if (!data || !data.success) {
//     await displayPopup("Failed to remove subscriber", "error");
//     return null;
//   }

//   await displayPopup(`Removed ${email} from mailing list`, "success");

//   // Refresh subscriber list
//   const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
//   if (subscriberData) {
//     await populateSubscriberList(subscriberData);
//     await updateSubscriberStats(subscriberData);
//   }

//   return data;
// };

// // Populate subscriber list
// export const populateSubscriberList = async (subscriberArray) => {
//   const subscriberList = document.getElementById("subscriber-list");
//   if (!subscriberList) return null;

//   // Clear existing content
//   subscriberList.innerHTML = "";

//   if (!subscriberArray || !subscriberArray.length) {
//     const emptyState = document.createElement("div");
//     emptyState.className = "subscriber-empty-state";
//     emptyState.textContent = "No subscribers yet";
//     subscriberList.append(emptyState);
//     return true;
//   }

//   subscriberArray.sort((a, b) => {
//     const aHasDate = a.date != null;
//     const bHasDate = b.date != null;

//     if (aHasDate && bHasDate) return new Date(b.date) - new Date(a.date); // newest first
//     if (aHasDate) return -1;  // dated entries float to top
//     if (bHasDate) return 1;
//     return a.email.localeCompare(b.email); // legacy: alphabetical by email
//   });

//   for (let i = 0; i < subscriberArray.length; i++) {
//     const subscriber = subscriberArray[i];
//     const subscriberItem = document.createElement("div");
//     subscriberItem.className = "subscriber-item";

//     const emailText = document.createElement("span");
//     emailText.className = "subscriber-email";
//     emailText.textContent = subscriber.email || subscriber;

//     const deleteButton = document.createElement("button");
//     deleteButton.className = "btn-delete-subscriber";
//     deleteButton.type = "button";
//     deleteButton.textContent = "×";
//     deleteButton.title = "Remove subscriber";
//     deleteButton.setAttribute("data-label", "remove-subscriber");
//     deleteButton.setAttribute("data-email", subscriber.email || subscriber);

//     subscriberItem.append(emailText, deleteButton);
//     subscriberList.append(subscriberItem);
//   }

//   return true;
// };

// export const runRefreshSubscriberList = async () => {
//   const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
//   if (!subscriberData) return null;
//   await populateSubscriberList(subscriberData);
//   await updateSubscriberStats(subscriberData);
//   return true;
// };

//-----------------------------

import { sendToBack, sendToBackFile } from "../util/api-front.js";
import { displayPopup, displayConfirmDialog } from "../util/popup.js";
import { updateSubscriberStats } from "./admin-run.js";
import { openImageEditor } from "./image-editor.js";
import { buildCtaButtonDialog, CTA_DEFAULT_TEXT } from "../forms/admin-form.js";

// ─── Quill instance — module-scoped so runSendNewsletter can read it ──────────
let quillInstance = null;

// ─── CTA button dialog state — module-scoped so dialog handlers can share it ──
let activeCtaNode = null; // DOM node of the CTA blot being edited, or null when inserting new
let cachedSiteUrl = null;
let ctaResizeStart = null; // { x, y, padX, padY } while dragging the resize handle, else null

// ─── CTA button size limits ────────────────────────────────────────────────────
const CTA_DEFAULT_PAD = { x: 28, y: 12 };
const CTA_PAD_X_MIN = 8;
const CTA_PAD_X_MAX = 120;
const CTA_PAD_Y_MIN = 4;
const CTA_PAD_Y_MAX = 60;

// ─── CTA button blot ────────────────────────────────────────────────────────────
// Registered once (guarded) so initQuill can run multiple times across modal opens.
let ctaBlotRegistered = false;
let CtaButtonBlot = null;

// ─── initQuill ────────────────────────────────────────────────────────────────
// Called by runModalTrigger (admin-run.js) after the write-newsletter modal
// is in the DOM. Mounts Quill and wires the custom image upload handler.

export const initQuill = () => {
  const editorEl = document.getElementById("newsletter-quill-editor");
  if (!editorEl || typeof Quill === "undefined") return;

  // Use style-based size attributor so sizes render as inline styles in email
  // (email clients strip CSS classes but preserve inline style attributes)
  const SizeStyle = Quill.import("attributors/style/size");
  SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"];
  Quill.register(SizeStyle, true);

  registerCtaButtonBlot();

  quillInstance = new Quill("#newsletter-quill-editor", {
    theme: "snow",
    placeholder: "Draft your newsletter message here...",
    modules: {
      toolbar: {
        container: [
          [{ size: [false, "12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "ctaButton"],
        ],
        handlers: {
          image: () => {
            // Trigger the hidden file input instead of Quill's default base64 behaviour
            document.getElementById("newsletter-image-file-input")?.click();
          },
          ctaButton: () => openCtaDialog(null),
        },
      },
      keyboard: {
        bindings: {
          enterPreserveSize: {
            key: "Enter",
            handler: function (range, context) {
              const size = context.format.size;
              const quill = this.quill;
              setTimeout(() => {
                if (size) quill.format("size", size);
              }, 0);
              return true; // propagate to Quill's default Enter handler
            },
          },
        },
      },
    },
  });

  // Add hover tooltips — Quill 2 does not set title attributes automatically
  const toolbarEl = quillInstance.getModule("toolbar").container;
  attachCtaToolbarButton(quillInstance);

  const buttonTitles = [
    [".ql-bold", "Bold"],
    [".ql-italic", "Italic"],
    [".ql-underline", "Underline"],
    [".ql-link", "Insert Link"],
    [".ql-image", "Insert Image"],
    [".ql-clean", "Remove Formatting"],
    ['.ql-list[value="ordered"]', "Numbered List"],
    ['.ql-list[value="bullet"]', "Bullet List"],
  ];
  for (let i = 0; i < buttonTitles.length; i++) {
    const el = toolbarEl.querySelector(buttonTitles[i][0]);
    if (el) el.title = buttonTitles[i][1];
  }
  const pickerLabels = toolbarEl.querySelectorAll(".ql-picker-label");
  const pickerTitles = ["Font Size"];
  for (let i = 0; i < pickerLabels.length; i++) {
    if (pickerTitles[i]) pickerLabels[i].title = pickerTitles[i];
  }
};

// ─── registerCtaButtonBlot ────────────────────────────────────────────────────

const registerCtaButtonBlot = () => {
  if (ctaBlotRegistered) return;

  const BlockEmbed = Quill.import("blots/block/embed");

  class Blot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      const align = normalizeCtaAlign(value.align);
      node.setAttribute("style", `text-align:${align}; margin:24px 0;`);
      node.setAttribute("contenteditable", "false");

      const padX = normalizeCtaPad(value.padX, "x");
      const padY = normalizeCtaPad(value.padY, "y");

      const anchor = document.createElement("a");
      anchor.setAttribute("href", value.url);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute(
        "style",
        `display:inline-block; padding:${padY}px ${padX}px; background:${value.bgColor}; color:${value.textColor}; text-decoration:none; border-radius:4px; font-weight:bold;`
      );
      anchor.textContent = value.text;

      node.append(anchor);
      return node;
    }

    static value(node) {
      const anchor = node.querySelector("a");
      if (!anchor) return null;
      return {
        text: anchor.textContent,
        url: anchor.getAttribute("href") || "",
        bgColor: toHexColor(anchor.style.backgroundColor),
        textColor: toHexColor(anchor.style.color),
        align: normalizeCtaAlign(node.style.textAlign),
        padX: normalizeCtaPad(parseInt(anchor.style.paddingLeft, 10), "x"),
        padY: normalizeCtaPad(parseInt(anchor.style.paddingTop, 10), "y"),
      };
    }
  }
  Blot.blotName = "ctaButton";
  Blot.tagName = "div";
  Blot.className = "newsletter-cta";

  Quill.register(Blot);
  CtaButtonBlot = Blot;
  ctaBlotRegistered = true;
};

// ─── normalizeCtaAlign ─────────────────────────────────────────────────────────

const normalizeCtaAlign = (value) => {
  if (value === "left" || value === "right" || value === "center") return value;
  return "center";
};

// ─── normalizeCtaPad ────────────────────────────────────────────────────────────

const normalizeCtaPad = (value, axis) => {
  const fallback = axis === "x" ? CTA_DEFAULT_PAD.x : CTA_DEFAULT_PAD.y;
  const min = axis === "x" ? CTA_PAD_X_MIN : CTA_PAD_Y_MIN;
  const max = axis === "x" ? CTA_PAD_X_MAX : CTA_PAD_Y_MAX;

  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;

  return Math.min(max, Math.max(min, Math.round(num)));
};

// ─── toHexColor ──────────────────────────────────────────────────────────────

const toHexColor = (colorValue) => {
  if (!colorValue) return "";
  if (/^#[0-9a-f]{6}$/i.test(colorValue)) return colorValue.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(colorValue)) {
    const hex3 = colorValue.slice(1);
    let expanded = "#";
    for (let i = 0; i < hex3.length; i++) {
      expanded += hex3[i] + hex3[i];
    }
    return expanded.toLowerCase();
  }

  const rgbMatch = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!rgbMatch) return "";

  const toHex = (channel) => Number(channel).toString(16).padStart(2, "0");
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
};

// ─── CTA click-to-edit ────────────────────────────────────────────────────────

const handleQuillCtaClick = (event) => {
  const ctaNode = event.target.closest(".newsletter-cta");
  if (!ctaNode) return;
  event.preventDefault();
  openCtaDialog(ctaNode);
};

// ─── CTA toolbar wiring — shared by initQuill and initEditQuill ──────────────
// Injects the button icon/tooltip and wires click-to-edit on whichever Quill
// instance (write or edit modal) is being constructed.

const attachCtaToolbarButton = (quill) => {
  const toolbarEl = quill.getModule("toolbar").container;
  const ctaButtonEl = toolbarEl.querySelector(".ql-ctaButton");
  if (ctaButtonEl) {
    ctaButtonEl.textContent = "Add Button";
    ctaButtonEl.title = "Add Button";
  }
  quill.root.addEventListener("click", handleQuillCtaClick);
};

// ─── CTA dialog ───────────────────────────────────────────────────────────────

const openCtaDialog = async (existingNode) => {
  const dialog = await buildCtaButtonDialog();
  if (!dialog) return;

  activeCtaNode = existingNode || null;
  dialog.dataset.padX = String(CTA_DEFAULT_PAD.x);
  dialog.dataset.padY = String(CTA_DEFAULT_PAD.y);
  document.body.append(dialog);
  dialog.classList.add("visible");

  if (existingNode) {
    prefillCtaDialog(dialog, existingNode);
  } else {
    const urlInput = dialog.querySelector("#cta-url");
    if (urlInput && !urlInput.value) {
      urlInput.value = await getSiteUrl();
      urlInput.classList.add("cta-default");
    }
  }
  wireCtaDialog(dialog);

  const textInput = dialog.querySelector("#cta-text");
  if (textInput) textInput.focus();
};

const getSiteUrl = async () => {
  if (cachedSiteUrl !== null) return cachedSiteUrl;

  const data = await sendToBack({ route: "/newsletter/site-url" }, "GET");
  if (data && typeof data.siteUrl === "string" && data.siteUrl) {
    cachedSiteUrl = data.siteUrl;
  } else {
    cachedSiteUrl = window.location.origin;
  }
  return cachedSiteUrl;
};

const prefillCtaDialog = (dialog, existingNode) => {
  const value = CtaButtonBlot ? CtaButtonBlot.value(existingNode) : null;
  if (!value) return;

  const textInput = dialog.querySelector("#cta-text");
  const urlInput = dialog.querySelector("#cta-url");
  const bgInput = dialog.querySelector("#cta-bg-color");
  const textColorInput = dialog.querySelector("#cta-text-color");
  const insertButton = dialog.querySelector("#cta-insert");
  const removeButton = dialog.querySelector("#cta-remove");

  if (textInput) textInput.value = value.text;
  if (urlInput) urlInput.value = value.url;
  if (bgInput) bgInput.value = value.bgColor;
  if (textColorInput) textColorInput.value = value.textColor;
  if (insertButton) insertButton.textContent = "Update";
  if (removeButton) removeButton.classList.remove("hidden");

  dialog.dataset.padX = String(normalizeCtaPad(value.padX, "x"));
  dialog.dataset.padY = String(normalizeCtaPad(value.padY, "y"));

  const prefillAlignButtons = dialog.querySelectorAll(".cta-align");
  for (let i = 0; i < prefillAlignButtons.length; i++) {
    if (prefillAlignButtons[i].getAttribute("data-align") === value.align) {
      prefillAlignButtons[i].classList.add("selected");
    } else {
      prefillAlignButtons[i].classList.remove("selected");
    }
  }

  updateCtaPreview(dialog);
};

const wireCtaDialog = (dialog) => {
  updateCtaPreview(dialog);

  const swatches = dialog.querySelectorAll(".cta-swatch");
  for (let i = 0; i < swatches.length; i++) {
    swatches[i].addEventListener("click", () => selectCtaSwatch(dialog, swatches[i]));
  }

  const alignButtons = dialog.querySelectorAll(".cta-align");
  for (let i = 0; i < alignButtons.length; i++) {
    alignButtons[i].addEventListener("click", () => selectCtaAlign(dialog, alignButtons[i]));
  }

  const inputs = dialog.querySelectorAll("#cta-text, #cta-url, #cta-bg-color, #cta-text-color");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", () => updateCtaPreview(dialog));
  }

  const urlInput = dialog.querySelector("#cta-url");
  if (urlInput) urlInput.addEventListener("input", () => clearCtaUrlDefault(urlInput));

  const cancelButton = dialog.querySelector("#cta-cancel");
  if (cancelButton) cancelButton.addEventListener("click", () => closeCtaDialog(dialog));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeCtaDialog(dialog);
  });

  const removeButton = dialog.querySelector("#cta-remove");
  if (removeButton) removeButton.addEventListener("click", () => removeCtaButton(dialog));

  const insertButton = dialog.querySelector("#cta-insert");
  if (insertButton) insertButton.addEventListener("click", () => submitCtaDialog(dialog));

  wireCtaResizeHandles(dialog);

  const resetButton = dialog.querySelector("#cta-size-reset");
  if (resetButton) resetButton.addEventListener("click", () => resetCtaSize(dialog));
};

const wireCtaResizeHandles = (dialog) => {
  const resizeHandles = dialog.querySelectorAll(".cta-resize-handle");
  for (const resizeHandle of resizeHandles) {
    wireCtaResizeHandle(dialog, resizeHandle);
  }
};

const wireCtaResizeHandle = (dialog, resizeHandle) => {
  resizeHandle.addEventListener("pointerdown", (event) => startCtaResize(dialog, event));
  resizeHandle.addEventListener("pointermove", (event) => moveCtaResize(dialog, event));
  resizeHandle.addEventListener("pointerup", (event) => endCtaResize(event));
  resizeHandle.addEventListener("pointercancel", (event) => endCtaResize(event));
};

const startCtaResize = (dialog, event) => {
  const handle = event.currentTarget;
  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
  ctaResizeStart = {
    x: event.clientX,
    y: event.clientY,
    padX: normalizeCtaPad(dialog.dataset.padX, "x"),
    padY: normalizeCtaPad(dialog.dataset.padY, "y"),
    directionX: handle.dataset.corner.includes("w") ? -1 : 1,
    directionY: handle.dataset.corner.includes("n") ? -1 : 1,
  };
};

const moveCtaResize = (dialog, event) => {
  if (!ctaResizeStart) return;

  const deltaX = Math.round(((event.clientX - ctaResizeStart.x) * ctaResizeStart.directionX) / 2);
  const deltaY = Math.round(((event.clientY - ctaResizeStart.y) * ctaResizeStart.directionY) / 2);
  dialog.dataset.padX = String(normalizeCtaPad(ctaResizeStart.padX + deltaX, "x"));
  dialog.dataset.padY = String(normalizeCtaPad(ctaResizeStart.padY + deltaY, "y"));
  updateCtaPreview(dialog);
};

const endCtaResize = (event) => {
  const handle = event.currentTarget;
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  ctaResizeStart = null;
};

const resetCtaSize = (dialog) => {
  dialog.dataset.padX = String(CTA_DEFAULT_PAD.x);
  dialog.dataset.padY = String(CTA_DEFAULT_PAD.y);
  updateCtaPreview(dialog);
};

const clearCtaUrlDefault = (urlInput) => {
  urlInput.classList.remove("cta-default");
};

const selectCtaSwatch = (dialog, swatchEl) => {
  const color = swatchEl.getAttribute("data-color");
  if (!color) return;
  const targetId = swatchEl.getAttribute("data-target") || "cta-bg-color";
  const targetInput = dialog.querySelector("#" + targetId);
  if (!targetInput) return;
  targetInput.value = color;
  updateCtaPreview(dialog);
};

const selectCtaAlign = (dialog, buttonEl) => {
  const alignButtons = dialog.querySelectorAll(".cta-align");
  for (let i = 0; i < alignButtons.length; i++) {
    alignButtons[i].classList.remove("selected");
  }
  buttonEl.classList.add("selected");
  updateCtaPreview(dialog);
};

const updateCtaPreview = (dialog) => {
  const preview = dialog.querySelector("#cta-preview");
  if (!preview) return;

  const text = dialog.querySelector("#cta-text")?.value.trim() || CTA_DEFAULT_TEXT;
  const bgColor = dialog.querySelector("#cta-bg-color")?.value || "#333333";
  const textColor = dialog.querySelector("#cta-text-color")?.value || "#ffffff";
  const padX = normalizeCtaPad(dialog.dataset.padX, "x");
  const padY = normalizeCtaPad(dialog.dataset.padY, "y");

  preview.textContent = text;
  preview.style.background = bgColor;
  preview.style.color = textColor;
  preview.style.padding = `${padY}px ${padX}px`;
  toggleCtaSizeReset(dialog, padX, padY);

  const previewWrap = dialog.querySelector(".cta-preview-wrap");
  if (previewWrap) {
    const selectedAlignButton = dialog.querySelector(".cta-align.selected");
    previewWrap.style.textAlign = normalizeCtaAlign(selectedAlignButton?.getAttribute("data-align"));
  }
};

const toggleCtaSizeReset = (dialog, padX, padY) => {
  const resetButton = dialog.querySelector("#cta-size-reset");
  if (!resetButton) return;

  const isDefaultSize = padX === CTA_DEFAULT_PAD.x && padY === CTA_DEFAULT_PAD.y;
  if (isDefaultSize) {
    resetButton.classList.add("hidden");
  } else {
    resetButton.classList.remove("hidden");
  }
};

const closeCtaDialog = (dialog) => {
  dialog.remove();
  activeCtaNode = null;
  ctaResizeStart = null;
};

const removeCtaButton = (dialog) => {
  if (!activeCtaNode || !quillInstance) {
    closeCtaDialog(dialog);
    return;
  }
  const blot = Quill.find(activeCtaNode);
  if (blot) {
    const index = quillInstance.getIndex(blot);
    quillInstance.deleteText(index, 1, "user");
  }
  closeCtaDialog(dialog);
};

const submitCtaDialog = async (dialog) => {
  if (!quillInstance) return;

  const value = readCtaDialogValue(dialog);
  const isValid = await validateCtaDialogValue(value);
  if (!isValid) return;

  if (activeCtaNode) {
    updateExistingCtaButton(value);
  } else {
    insertNewCtaButton(value);
  }

  closeCtaDialog(dialog);
};

const readCtaDialogValue = (dialog) => ({
  text: dialog.querySelector("#cta-text")?.value.trim() || "",
  url: dialog.querySelector("#cta-url")?.value.trim() || "",
  bgColor: dialog.querySelector("#cta-bg-color")?.value || "",
  textColor: dialog.querySelector("#cta-text-color")?.value || "",
  align: normalizeCtaAlign(dialog.querySelector(".cta-align.selected")?.getAttribute("data-align")),
  padX: normalizeCtaPad(dialog.dataset.padX, "x"),
  padY: normalizeCtaPad(dialog.dataset.padY, "y"),
});

const validateCtaDialogValue = async (value) => {
  if (!value.text || !value.url) {
    await displayPopup("Enter both button text and link", "error");
    return false;
  }
  if (!/^https?:\/\//i.test(value.url)) {
    await displayPopup("Button link must start with http:// or https://", "error");
    return false;
  }
  if (!/^#[0-9a-f]{6}$/i.test(value.bgColor) || !/^#[0-9a-f]{6}$/i.test(value.textColor)) {
    await displayPopup("Button colors must be valid hex colors", "error");
    return false;
  }
  return true;
};

const insertNewCtaButton = (value) => {
  const range = quillInstance.getSelection(true);
  const index = range ? range.index : quillInstance.getLength();
  quillInstance.insertEmbed(index, "ctaButton", value, "user");
  quillInstance.setSelection(index + 1, 0, "silent");
};

const updateExistingCtaButton = (value) => {
  const blot = Quill.find(activeCtaNode);
  if (!blot) return;
  const index = quillInstance.getIndex(blot);
  quillInstance.deleteText(index, 1, "user");
  quillInstance.insertEmbed(index, "ctaButton", value, "user");
  quillInstance.setSelection(index + 1, 0, "silent");
};

// ─── resetQuill ───────────────────────────────────────────────────────────────
// Called by runModalClose (admin-run.js) when the write-newsletter modal closes.

export const resetQuill = () => {
  quillInstance = null;
};

// ─── Image upload ─────────────────────────────────────────────────────────────

export const runNewsletterImageUpload = async (fileInput) => {
  const file = fileInput.files[0];
  if (!file || !quillInstance) return;

  const formData = new FormData();
  formData.append("image", file);

  const result = await sendToBackFile({
    route: "/upload-newsletter-pic-route",
    formData,
  });

  fileInput.value = ""; // reset so same file can be re-selected if needed

  if (!result || result === "FAIL" || !result.filename) {
    await displayPopup("Image upload failed", "error");
    return;
  }

  // Save cursor position before opening Cropper
  const cursorIndex = quillInstance.getSelection()?.index ?? 0;

  const uploadExt = (result.filename.split('.').pop() || 'jpg').toLowerCase();
  const uploadMime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[uploadExt] || 'image/jpeg';
  const uploadBlobExt = uploadMime === 'image/png' ? 'png' : uploadMime === 'image/webp' ? 'webp' : 'jpg';

  openImageEditor({
    src: `/images/newsletter/${result.filename}`,
    mimeType: uploadMime,
    onApply: async (blob) => {
      const insertIndex = quillInstance?.getSelection()?.index ?? cursorIndex;
      if (!quillInstance) return;
      // Upload the cropped blob
      const cropFormData = new FormData();
      cropFormData.append("image", blob, `cropped.${uploadBlobExt}`);

      const newResult = await sendToBackFile({
        route: "/upload-newsletter-pic-route",
        formData: cropFormData,
      });

      if (!newResult || newResult === "FAIL" || !newResult.filename) {
        await displayPopup("Image upload failed", "error");
        return;
      }

      // Insert the cropped image into Quill
      const sizeBefore = quillInstance.getFormat(insertIndex).size || null;
      quillInstance.insertEmbed(insertIndex, "image", `/images/newsletter/${newResult.filename}`);
      quillInstance.setSelection(insertIndex + 1);
      if (sizeBefore) quillInstance.format("size", sizeBefore);

      // Set data-original-src on the inserted image DOM node
      const imgs = quillInstance.root.querySelectorAll("img");
      for (let i = 0; i < imgs.length; i++) {
        if (imgs[i].getAttribute("src") === `/images/newsletter/${newResult.filename}`) {
          imgs[i].setAttribute("data-original-src", `/images/newsletter/${result.filename}`);
          break;
        }
      }
    },
  });
};

// ─── Report newsletter send result ────────────────────────────────────────────
// Shared by runSendNewsletter and runSendTestNewsletter. Surfaces the real
// server message instead of a hardcoded string, so a MAIL_MODE=log response
// (data.logMode: true — email logged, not actually sent) is not mistaken for
// a real send, and real server failures are not masked by a generic string.

const reportSendResult = async (data, successText, failureText) => {
  if (!data || !data.success) {
    await displayPopup(data && data.message ? data.message : failureText, "error");
    return;
  }

  if (data.logMode) {
    await displayPopup(data.message, "error");
    return;
  }

  await displayPopup(successText, "success");
};

// ─── Editor content check ─────────────────────────────────────────────────────
// Quill's getText() omits embeds (images, CTA buttons), so a newsletter made of
// only a button reads as empty. Walk the delta instead: any embed or any
// non-whitespace text counts as content.

const hasEditorContent = () => {
  if (!quillInstance) return false;

  const ops = quillInstance.getContents().ops;
  for (let i = 0; i < ops.length; i++) {
    const insert = ops[i].insert;
    if (typeof insert !== "string") return true;
    if (insert.trim().length > 0) return true;
  }

  return false;
};

// ─── Send newsletter ──────────────────────────────────────────────────────────

export const runSendNewsletter = async () => {
  const subject = document.getElementById("newsletter-subject");

  if (!hasEditorContent()) {
    await displayPopup("Please enter a message", "error");
    return null;
  }

  const htmlContent = quillInstance.root.innerHTML;

  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  const subscriberCount = subscriberData ? subscriberData.length : 0;
  const confirmDialog = await displayConfirmDialog(
    `Are you sure you want to send this newsletter to your ${subscriberCount} subscriber${subscriberCount !== 1 ? "s" : ""}?`
  );
  if (!confirmDialog) return null;

  const data = await sendToBack({
    route: "/newsletter/send",
    subject: subject ? subject.value.trim() : "",
    html: htmlContent,
  });

  await reportSendResult(data, "Newsletter sent successfully", "Failed to send newsletter");
  if (!data || !data.success) return null;
  if (data.logMode) return data;

  quillInstance = null;

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  return data;
};

// ─── Send test newsletter ─────────────────────────────────────────────────────

export const runSendTestNewsletter = async () => {
  const subject = document.getElementById("newsletter-subject");

  if (!hasEditorContent()) {
    await displayPopup("Please enter a message", "error");
    return null;
  }

  const htmlContent = quillInstance.root.innerHTML;

  const confirmed = await displayConfirmDialog("Send a test to the admin email addresses?");
  if (!confirmed) return null;

  const data = await sendToBack({
    route: "/newsletter/send-test",
    subject: subject ? subject.value.trim() : "",
    html: htmlContent,
  });

  await reportSendResult(data, "Test newsletter sent", "Failed to send test newsletter");
  if (!data || !data.success) return null;

  return data;
};

// ─── Add subscriber ───────────────────────────────────────────────────────────

export const runAddSubscriber = async () => {
  const emailInput = document.getElementById("new-subscriber-email");
  if (!emailInput || !emailInput.value.trim()) {
    await displayPopup("Please enter an email address", "error");
    return null;
  }

  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await displayPopup("Please enter a valid email address", "error");
    return null;
  }

  const data = await sendToBack({ route: "/newsletter/add", email });
  if (!data || !data.success) {
    await displayPopup("Failed to add subscriber", "error");
    return null;
  }
  if (data.duplicate) {
    await displayPopup(`${email} is already subscribed`, "error");
    return null;
  }

  await displayPopup(`Added ${email} to mailing list`, "success");
  emailInput.value = "";

  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  if (subscriberData) {
    await populateSubscriberList(subscriberData);
    await updateSubscriberStats(subscriberData);
  }
  return data;
};

// ─── Remove subscriber ────────────────────────────────────────────────────────

export const runRemoveSubscriber = async (clickElement) => {
  if (!clickElement) return null;
  const email = clickElement.getAttribute("data-email");
  if (!email) return null;

  const confirmDialog = await displayConfirmDialog(`Are you sure you want to remove ${email} from the mailing list?`);
  if (!confirmDialog) return null;

  const data = await sendToBack({ route: "/newsletter/remove", email });
  if (!data || !data.success) {
    await displayPopup("Failed to remove subscriber", "error");
    return null;
  }

  await displayPopup(`Removed ${email} from mailing list`, "success");

  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  if (subscriberData) {
    await populateSubscriberList(subscriberData);
    await updateSubscriberStats(subscriberData);
  }
  return data;
};

// ─── Populate subscriber list ─────────────────────────────────────────────────

export const populateSubscriberList = async (subscriberArray) => {
  const subscriberList = document.getElementById("subscriber-list");
  if (!subscriberList) return null;

  subscriberList.innerHTML = "";

  if (!subscriberArray || !subscriberArray.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "subscriber-empty-state";
    emptyState.textContent = "No subscribers yet";
    subscriberList.append(emptyState);
    return true;
  }

  subscriberArray.sort((a, b) => {
    const aHasDate = a.date != null;
    const bHasDate = b.date != null;
    if (aHasDate && bHasDate) return new Date(b.date) - new Date(a.date);
    if (aHasDate) return -1;
    if (bHasDate) return 1;
    return a.email.localeCompare(b.email);
  });

  for (let i = 0; i < subscriberArray.length; i++) {
    const subscriber = subscriberArray[i];
    const subscriberItem = document.createElement("div");
    subscriberItem.className = "subscriber-item";

    const emailText = document.createElement("span");
    emailText.className = "subscriber-email";
    emailText.textContent = subscriber.email || subscriber;

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn-delete-subscriber";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Remove subscriber";
    deleteButton.setAttribute("data-label", "remove-subscriber");
    deleteButton.setAttribute("data-email", subscriber.email || subscriber);

    subscriberItem.append(emailText, deleteButton);
    subscriberList.append(subscriberItem);
  }
  return true;
};

// ─── Refresh subscriber list ──────────────────────────────────────────────────

export const runRefreshSubscriberList = async () => {
  const subscriberData = await sendToBack({ route: "/newsletter/data" }, "GET");
  if (!subscriberData) return null;
  await populateSubscriberList(subscriberData);
  await updateSubscriberStats(subscriberData);
  return true;
};

// ─── Newsletter archive selector ──────────────────────────────────────────────

export const populateAdminNewsletterSelector = async (newsletters) => {
  const selector = document.getElementById("newsletter-archive-selector");
  if (!selector) return null;

  // Remove all options except the default first one
  while (selector.options.length > 1) {
    selector.remove(1);
  }

  for (let i = 0; i < newsletters.length; i++) {
    const newsletter = newsletters[i];
    const option = document.createElement("option");
    option.value = newsletter.id;

    const subject = newsletter.subject && newsletter.subject.length > 50
      ? newsletter.subject.slice(0, 50) + "\u2026"
      : newsletter.subject || "(No Subject)";
    const sentDate = newsletter.sentAt ? new Date(newsletter.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
    option.textContent = sentDate ? `${subject} \u2014 ${sentDate}` : subject;

    option.newsletterData = newsletter;
    selector.append(option);
  }

  return true;
};

// ─── Newsletter selector change ───────────────────────────────────────────────

export const changeAdminNewsletterSelector = async (changeElement) => {
  if (!changeElement) return null;

  const selectedOption = changeElement.options[changeElement.selectedIndex];
  if (!selectedOption || !selectedOption.newsletterData) return null;

  const newsletter = selectedOption.newsletterData;

  if (quillInstance) {
    if (newsletter.html) {
      quillInstance.clipboard.dangerouslyPasteHTML(newsletter.html);
      // Restore data-original-src attributes Quill may have stripped during Delta conversion
      const parser = new DOMParser();
      const doc = parser.parseFromString(newsletter.html, "text/html");
      const originalImgs = doc.querySelectorAll("img[data-original-src]");
      if (originalImgs.length) {
        const quillImgs = quillInstance.root.querySelectorAll("img");
        for (let i = 0; i < originalImgs.length; i++) {
          const storedFilename = originalImgs[i].getAttribute("src").split("/").pop();
          const storedOriginalSrc = originalImgs[i].getAttribute("data-original-src");
          for (let j = 0; j < quillImgs.length; j++) {
            if (quillImgs[j].src.split("/").pop() === storedFilename) {
              quillImgs[j].setAttribute("data-original-src", storedOriginalSrc);
              break;
            }
          }
        }
      }
    } else if (newsletter.text) {
      quillInstance.setText(newsletter.text);
    } else {
      quillInstance.setContents([]);
    }
  }

  changeElement.newsletterId = newsletter.id;
  changeElement.originalHtml = quillInstance ? quillInstance.root.innerHTML : (newsletter.html || "");

  const deleteButton = document.getElementById("delete-newsletter-button");
  const updateButton = document.getElementById("edit-newsletter-submit-button");
  if (deleteButton) deleteButton.disabled = false;
  if (updateButton) updateButton.disabled = false;

  return true;
};

// ─── Delete newsletter ────────────────────────────────────────────────────────

export const runDeleteNewsletter = async () => {
  const selector = document.getElementById("newsletter-archive-selector");
  const id = selector ? selector.newsletterId : null;
  if (!id) {
    await displayPopup("No newsletter selected", "error");
    return null;
  }

  const confirmed = await displayConfirmDialog("Delete this newsletter from the archive?");
  if (!confirmed) return null;

  const data = await sendToBack({ route: "/newsletter/delete", id });
  if (!data || !data.success) {
    await displayPopup("Failed to delete newsletter", "error");
    return null;
  }

  await displayPopup("Newsletter deleted", "success");
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  return data;
};

// ─── Update newsletter ────────────────────────────────────────────────────────

export const runUpdateNewsletter = async () => {
  const selector = document.getElementById("newsletter-archive-selector");
  const id = selector ? selector.newsletterId : null;
  if (!id) {
    await displayPopup("No newsletter selected", "error");
    return null;
  }

  if (!quillInstance) {
    await displayPopup("Editor not ready", "error");
    return null;
  }

  const html = quillInstance.root.innerHTML;
  if (!html || !hasEditorContent()) {
    await displayPopup("Please enter content", "error");
    return null;
  }

  if (html === selector.originalHtml) return null;

  const data = await sendToBack({ route: "/newsletter/update", id, html });
  if (!data || !data.success) {
    await displayPopup("Failed to update newsletter", "error");
    return null;
  }

  await displayPopup("Newsletter updated", "success");
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

  return data;
};

// ─── Click-to-edit existing Quill image ──────────────────────────────────────

export async function handleQuillImageClick(imgElement) {
  if (!quillInstance) return;
  const src = imgElement.src;  // absolute URL — used for Cropper.js loading only
  const filename = src.split("/").pop();
  // Use the src *attribute* (relative path) as fallback so data-original-src is always stored relative
  const srcAttr = imgElement.getAttribute("src") || src;
  const originalSrc = imgElement.getAttribute("data-original-src") || srcAttr;
  const originalFilename = originalSrc.split("/").pop();
  const hasOriginal = imgElement.hasAttribute("data-original-src");

  const nlExt = (filename.split('.').pop() || 'jpg').toLowerCase();
  const nlMime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[nlExt] || 'image/jpeg';
  const nlBlobExt = nlMime === 'image/png' ? 'png' : nlMime === 'image/webp' ? 'webp' : 'jpg';

  openImageEditor({
    src,
    mimeType: nlMime,
    originalSrc: hasOriginal ? originalSrc : undefined,
    onRevert: hasOriginal ? async () => {
      if (filename !== originalFilename) {
        await sendToBack({ route: "/delete-pic-route", filename, entityType: "newsletter" });
      }
      // Update Quill delta so re-renders show the reverted image
      const delta = quillInstance.getContents();
      let charIndex = 0;
      let foundIndex = -1;
      for (let i = 0; i < delta.ops.length; i++) {
        const op = delta.ops[i];
        if (op.insert && typeof op.insert === 'object' && op.insert.image === srcAttr) {
          foundIndex = charIndex;
          break;
        }
        charIndex += (typeof op.insert === 'string') ? op.insert.length : 1;
      }
      if (foundIndex !== -1) {
        quillInstance.deleteText(foundIndex, 1, 'api');
        quillInstance.insertEmbed(foundIndex, 'image', originalSrc, 'api');
        // No data-original-src on reverted image — it's back to the original
      } else {
        // Fallback: direct DOM manipulation if not found in delta
        imgElement.src = originalSrc;
        imgElement.removeAttribute("data-original-src");
      }
    } : undefined,
    onApply: async (blob) => {
      const currentSrc = imgElement.src;  // read dynamically — may differ from open-time if user reverted
      const currentFilename = currentSrc.split("/").pop();
      const cropFormData = new FormData();
      cropFormData.append("image", blob, `cropped.${nlBlobExt}`);

      const newResult = await sendToBackFile({
        route: "/upload-newsletter-pic-route",
        formData: cropFormData,
      });

      if (!newResult || newResult === "FAIL" || !newResult.filename) {
        displayPopup("Image upload failed", "error");
        return;
      }

      // Only delete if the current file is not the original
      if (currentFilename !== originalFilename) {
        await sendToBack({ route: "/delete-pic-route", filename: currentFilename, entityType: "newsletter" });
      }

      const newRelativeSrc = `/images/newsletter/${newResult.filename}`;
      // Update Quill delta so re-renders show the edited image
      const applyDelta = quillInstance.getContents();
      let applyCharIndex = 0;
      let applyFoundIndex = -1;
      for (let i = 0; i < applyDelta.ops.length; i++) {
        const op = applyDelta.ops[i];
        if (op.insert && typeof op.insert === 'object' && op.insert.image === srcAttr) {
          applyFoundIndex = applyCharIndex;
          break;
        }
        applyCharIndex += (typeof op.insert === 'string') ? op.insert.length : 1;
      }
      if (applyFoundIndex !== -1) {
        quillInstance.deleteText(applyFoundIndex, 1, 'api');
        quillInstance.insertEmbed(applyFoundIndex, 'image', newRelativeSrc, 'api');
        // Set data-original-src on the newly rendered img element
        const allImgs = quillInstance.root.querySelectorAll('img');
        for (let j = 0; j < allImgs.length; j++) {
          if (allImgs[j].getAttribute('src') === newRelativeSrc) {
            allImgs[j].setAttribute('data-original-src', originalSrc);
            break;
          }
        }
      } else {
        // Fallback: direct DOM if not found in delta
        imgElement.src = newRelativeSrc;
        imgElement.setAttribute('data-original-src', originalSrc);
      }
    },
  });
}

// ─── Init Quill for edit mode ─────────────────────────────────────────────────

export const initEditQuill = () => {
  const editorEl = document.getElementById("edit-newsletter-quill-editor");
  if (!editorEl || typeof Quill === "undefined") return;

  const SizeStyle = Quill.import("attributors/style/size");
  SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"];
  Quill.register(SizeStyle, true);

  registerCtaButtonBlot();

  quillInstance = new Quill("#edit-newsletter-quill-editor", {
    theme: "snow",
    placeholder: "Newsletter content will appear here after selecting a newsletter...",
    modules: {
      toolbar: {
        container: [
          [{ size: [false, "12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image", "ctaButton"],
        ],
        handlers: {
          image: () => {
            document.getElementById("edit-newsletter-image-file-input")?.click();
          },
          ctaButton: () => openCtaDialog(null),
        },
      },
      keyboard: {
        bindings: {
          enterPreserveSize: {
            key: "Enter",
            handler: function (range, context) {
              const size = context.format.size;
              const quill = this.quill;
              setTimeout(() => {
                if (size) quill.format("size", size);
              }, 0);
              return true;
            },
          },
        },
      },
    },
  });

  const toolbarEl = quillInstance.getModule("toolbar").container;
  attachCtaToolbarButton(quillInstance);

  const buttonTitles = [
    [".ql-bold", "Bold"],
    [".ql-italic", "Italic"],
    [".ql-underline", "Underline"],
    [".ql-link", "Insert Link"],
    [".ql-image", "Insert Image"],
    [".ql-clean", "Remove Formatting"],
    ['.ql-list[value="ordered"]', "Numbered List"],
    ['.ql-list[value="bullet"]', "Bullet List"],
  ];
  for (let i = 0; i < buttonTitles.length; i++) {
    const el = toolbarEl.querySelector(buttonTitles[i][0]);
    if (el) el.title = buttonTitles[i][1];
  }
  const pickerLabels = toolbarEl.querySelectorAll(".ql-picker-label");
  const pickerTitles = ["Font Size"];
  for (let i = 0; i < pickerLabels.length; i++) {
    if (pickerTitles[i]) pickerLabels[i].title = pickerTitles[i];
  }
};
