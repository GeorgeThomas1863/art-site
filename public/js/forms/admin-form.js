export const buildAdminForm = async () => {
  const adminFormWrapper = document.createElement("ul");
  adminFormWrapper.id = "admin-form-wrapper";

  // Create form title
  const adminTitle = document.createElement("h1");
  adminTitle.className = "admin-form-title";
  adminTitle.textContent = "Add New Product";
  adminFormWrapper.appendChild(adminTitle);

  // Create fields container
  const adminFormInputList = document.createElement("ul");
  adminFormInputList.className = "admin-form-input-list";

  // Form fields configuration
  const fields = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "price", label: "Price", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", required: true },
  ];

  // Create each form field
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldWrapper = document.createElement("li");
    fieldWrapper.className = "form-field";

    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = field.label;
    label.setAttribute("for", field.name);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "form-textarea";
    } else {
      input = document.createElement("input");
      input.className = "form-input";
      input.type = field.type;
    }

    input.id = field.name;
    input.name = field.name;

    fieldWrapper.append(label, input);
    adminFormInputList.append(fieldWrapper);
  }

  adminFormWrapper.append(adminFormInputList);

  // Create upload section
  const uploadSection = document.createElement("div");
  uploadSection.className = "upload-section";

  const uploadLabel = document.createElement("label");
  uploadLabel.className = "upload-label";
  uploadLabel.textContent = "Image";
  uploadSection.appendChild(uploadLabel);

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.className = "upload-button";
  uploadButton.textContent = "Choose Image";
  uploadSection.appendChild(uploadButton);

  adminFormWrapper.appendChild(uploadSection);

  // Create submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "submit-button";
  submitButton.textContent = "Submit";
  adminFormWrapper.appendChild(submitButton);

  return adminFormWrapper;
};
