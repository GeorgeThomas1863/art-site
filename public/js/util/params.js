export const getNewProductParams = async () => {
  const params = {
    title: document.getElementById("title").value,
    price: document.getElementById("price").value,
    description: document.getElementById("description").value,
    picData: document.getElementById("upload-button").dataset.uploadData,
  };
  return params;
};
