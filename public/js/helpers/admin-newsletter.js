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
  SizeStyle.whitelist = ["12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"];
  Quill.register(SizeStyle, true);

  quillInstance = new Quill("#newsletter-quill-editor", {
    theme: "snow",
    placeholder: "Draft your newsletter message here...",
    modules: {
      toolbar: {
        container: [
          [{ size: [false, "12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
        ],
        handlers: {
          image: () => {
            // Trigger the hidden file input instead of Quill's default base64 behaviour
            document.getElementById("newsletter-image-file-input")?.click();
          },
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

  openImageEditor({
    src: `/images/newsletter/${result.filename}`,
    onApply: async (blob) => {
      const insertIndex = quillInstance?.getSelection()?.index ?? cursorIndex;
      if (!quillInstance) return;
      // Upload the cropped blob
      const cropFormData = new FormData();
      cropFormData.append("image", blob, "cropped.jpg");

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

// ─── Send test newsletter ─────────────────────────────────────────────────────

export const runSendTestNewsletter = async () => {
  const subject = document.getElementById("newsletter-subject");

  if (!quillInstance || quillInstance.getText().trim().length === 0) {
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

  if (!data || !data.success) {
    await displayPopup("Failed to send test newsletter", "error");
    return null;
  }

  await displayPopup("Test newsletter sent", "success");
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
  if (!html || quillInstance.getText().trim().length === 0) {
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

  openImageEditor({
    src,
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
      cropFormData.append("image", blob, "cropped.jpg");

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

  quillInstance = new Quill("#edit-newsletter-quill-editor", {
    theme: "snow",
    placeholder: "Newsletter content will appear here after selecting a newsletter...",
    modules: {
      toolbar: {
        container: [
          [{ size: [false, "12px", "14px", "16px", "18px", "20px", "22px", "24px", "26px", "28px", "30px", "32px", "34px", "36px", "38px", "40px"] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
        ],
        handlers: {
          image: () => {
            document.getElementById("edit-newsletter-image-file-input")?.click();
          },
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
