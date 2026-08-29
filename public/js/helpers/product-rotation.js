export const buildProductRotationEntries = (products) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  const entries = [];
  for (let i = 0; i < products.length; i++) {
    appendProductEntries(entries, products[i]);
  }
  return entries;
};

const appendProductEntries = (entries, product) => {
  if (!product || product.display === "no") return;

  const pics = normalizePictures(product.picData);
  for (let i = 0; i < pics.length; i++) {
    const entry = buildRotationEntry(pics[i], product.urlName);
    if (!entry) continue;
    entries.push(entry);
  }
};

const normalizePictures = (picData) => {
  if (!picData) return [];
  return Array.isArray(picData) ? picData : [picData];
};

const buildRotationEntry = (picture, urlName) => {
  if (!picture?.filename || !isImagePicture(picture)) return null;
  return { src: `/images/products/${picture.filename}`, urlName };
};

const isImagePicture = (picture) => {
  if (!picture.mediaType) return true;
  const mediaType = String(picture.mediaType).toLowerCase();
  return mediaType === "image" || mediaType.startsWith("image/");
};
