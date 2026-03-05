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

// ─── Quill instance — module-scoped so runSendNewsletter can read it ──────────
let quillInstance = null;

// ─── initQuill ────────────────────────────────────────────────────────────────
// Called by runModalTrigger (admin-run.js) after the write-newsletter modal
// is in the DOM. Mounts Quill and wires the custom image upload handler.

export const initQuill = () => {
  const editorEl = document.getElementById("newsletter-quill-editor");
  if (!editorEl || typeof Quill === "undefined") return;

  // Use style-based size attributor so sizes render as inline styles in email
  // (email clients strip CSS classes but preserve inline style attributes)
  const SizeStyle = Quill.import("attributors/style/size");
  SizeStyle.whitelist = ["12px", "14px"];
  Quill.register(SizeStyle, true);

  quillInstance = new Quill("#newsletter-quill-editor", {
    theme: "snow",
    placeholder: "Write your newsletter message...",
    modules: {
      toolbar: {
        container: [
          [{ size: ["12px", false, "14px"] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: () => {
            // Trigger the hidden file input instead of Quill's default base64 behaviour
            document.getElementById("newsletter-image-file-input")?.click();
          },
        },
      },
    },
  });

  // Wire the file input — attaching here guarantees the element is in the DOM
  const fileInput = document.getElementById("newsletter-image-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", () => runNewsletterImageUpload(fileInput));
  }

  // Add hover tooltips — Quill 2 does not set title attributes automatically
  const toolbarEl = quillInstance.getModule("toolbar").container;
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

// ─── resetQuill ───────────────────────────────────────────────────────────────
// Called by runModalClose (admin-run.js) when the write-newsletter modal closes.

export const resetQuill = () => {
  quillInstance = null;
};

// ─── Image upload ─────────────────────────────────────────────────────────────

const runNewsletterImageUpload = async (fileInput) => {
  const file = fileInput.files[0];
  if (!file || !quillInstance) return;

  const formData = new FormData();
  formData.append("image", file);

  const data = await sendToBackFile({
    route: "/upload-newsletter-pic-route",
    formData,
  });

  fileInput.value = ""; // reset so same file can be re-selected if needed

  if (!data || data === "FAIL" || !data.filename) {
    await displayPopup("Image upload failed", "error");
    return;
  }

  const imageUrl = `${window.location.origin}/images/newsletter/${data.filename}`;
  const range = quillInstance.getSelection(true);
  quillInstance.insertEmbed(range.index, "image", imageUrl);
  quillInstance.setSelection(range.index + 1); // advance cursor past image
};

// ─── Send newsletter ──────────────────────────────────────────────────────────

export const runSendNewsletter = async () => {
  const subject = document.getElementById("newsletter-subject");

  if (!quillInstance || quillInstance.getText().trim().length === 0) {
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

  if (!data || !data.success) {
    await displayPopup("Failed to send newsletter", "error");
    return null;
  }

  await displayPopup("Newsletter sent successfully", "success");
  quillInstance = null;

  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();

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
