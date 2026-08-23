// Builds the minimal Express-shaped req object the src/ functions read from.

export const buildReq = ({ body = {}, session = {}, ip = "127.0.0.1" } = {}) => {
  return { body, session, ip };
};

export const buildCartItem = (overrides = {}) => {
  return {
    productId: "prod-1",
    productCode: "A-1",
    name: "Acorn Necklace",
    price: 25,
    quantity: 1,
    picData: null,
    canShip: "yes",
    weight: 0.5,
    length: 4,
    width: 3,
    height: 2,
    ...overrides,
  };
};

export const buildProductDoc = (overrides = {}) => {
  return {
    productId: "prod-1",
    productCode: "A-1",
    name: "Acorn Necklace",
    price: 25,
    picData: null,
    canShip: "yes",
    weight: 0.5,
    length: 4,
    width: 3,
    height: 2,
    ...overrides,
  };
};
