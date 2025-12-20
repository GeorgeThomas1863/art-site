export const getNewProductParams = async () => {
  const params = {
    name: document.getElementById("name").value,
    productType: document.getElementById("product-type").value,
    price: document.getElementById("price").value,
    description: document.getElementById("description").value,
    display: document.getElementById("display").value,
    sold: document.getElementById("sold").value,
    picData: document.getElementById("upload-button").uploadData,
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
