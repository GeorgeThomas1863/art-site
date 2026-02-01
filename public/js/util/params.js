export const buildNewProductParams = async () => {
  const params = {
    route: "/add-new-product-route",
    name: document.getElementById("name").value,
    productType: document.getElementById("product-type").value,
    price: document.getElementById("price").value,
    description: document.getElementById("description").value,
    display: document.getElementById("display").value,
    sold: document.getElementById("sold").value,
    picData: document.getElementById("upload-button").uploadData,
    dateCreated: new Date().toISOString(),
  };
  return params;
};

export const getEditProductParams = async () => {
  //product id and route added later
  const params = {
    name: document.getElementById("edit-name").value,
    productType: document.getElementById("edit-product-type").value,
    price: document.getElementById("edit-price").value,
    description: document.getElementById("edit-description").value,
    display: document.getElementById("edit-display").value,
    sold: document.getElementById("edit-sold").value,
    picData: document.getElementById("edit-upload-button").uploadData,
  };

  return params;
};

export const buildNewEventParams = async () => {
  const params = {
    route: "/add-new-event-route",
    name: document.getElementById("name").value,
    eventDate: document.getElementById("event-date").value,
    eventLocation: document.getElementById("event-location").value,
    eventDescription: document.getElementById("event-description").value,
    picData: document.getElementById("upload-button").uploadData,
    dateCreated: new Date().toISOString(),
  };
  return params;
};

export const getEditEventParams = async () => {
  const params = {
    name: document.getElementById("edit-name").value,
    eventDate: document.getElementById("edit-event-date").value,
    eventLocation: document.getElementById("edit-event-location").value,
    eventDescription: document.getElementById("edit-event-description").value,
    picData: document.getElementById("edit-upload-button").uploadData,
  };

  return params;
};

export const getCustomerParams = async () => {
  const params = {
    firstName: document.getElementById("first-name").value,
    lastName: document.getElementById("last-name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zip: document.getElementById("zip").value,
  };

  return params;
};

export const buildContactParams = async () => {
  const params = {
    route: "/contact-submit",
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
    newsletter: document.getElementById("newsletter").checked,
  };

  return params;
};
