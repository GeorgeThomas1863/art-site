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
