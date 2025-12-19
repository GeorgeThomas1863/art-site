export const getNewProductParams = async () => {
  const params = {
    productType: document.getElementById("product-type").value,
    name: document.getElementById("name").value,
    price: document.getElementById("price").value,
    description: document.getElementById("description").value,
    picData: document.getElementById("upload-button").uploadData,
  };
  return params;
};
