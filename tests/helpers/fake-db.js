// In-memory stand-in for models/db-model.js.
// Wired in globally by tests/setup.js so importing any src/ module never touches Mongo.
// Tests seed collections with seedCollection() and inspect them with readCollection().

const collectionMap = new Map();
let nextInsertId = 1;

//---------- test-facing helpers ----------

export const seedCollection = (collection, docArray) => {
  const copyArray = [];
  for (const doc of docArray) copyArray.push({ ...doc });
  collectionMap.set(collection, copyArray);
};

export const readCollection = (collection) => {
  return collectionMap.get(collection) ?? [];
};

export const resetFakeDb = () => {
  collectionMap.clear();
  nextInsertId = 1;
};

//---------- the fake model ----------

export class FakeDbModel {
  constructor(dataObject, collection) {
    this.dataObject = dataObject;
    this.collection = collection;
  }

  async storeAny() {
    const insertedId = `fake-id-${nextInsertId++}`;
    const doc = { ...this.dataObject, _id: insertedId };
    getOrCreateDocArray(this.collection).push(doc);
    return { acknowledged: true, insertedId };
  }

  async updateObjItem() {
    const { keyToLookup, itemValue, updateObj } = this.dataObject;
    const doc = findFirstDoc(this.collection, { [keyToLookup]: itemValue });
    if (!doc) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    Object.assign(doc, stripDollarKeys(updateObj));
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async matchMultiItems() {
    const { keyToLookup1, keyToLookup2, keyToLookup3, itemValue1, itemValue2, itemValue3 } = this.dataObject;
    const doc = findFirstDoc(this.collection, {
      [keyToLookup1]: itemValue1,
      [keyToLookup2]: itemValue2,
      [keyToLookup3]: itemValue3,
    });
    return doc ? { ...doc } : null;
  }

  async getAll() {
    const copyArray = [];
    for (const doc of readCollection(this.collection)) copyArray.push({ ...doc });
    return copyArray;
  }

  async getUniqueItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const doc = findFirstDoc(this.collection, { [keyToLookup]: itemValue });
    return doc ? { ...doc } : null;
  }

  async getMaxId() {
    const keyToLookup = this.dataObject.keyToLookup;
    if (typeof keyToLookup !== "string") return null;
    let maxValue = null;
    for (const doc of readCollection(this.collection)) {
      if (doc[keyToLookup] === undefined) continue;
      const numeric = +doc[keyToLookup];
      if (maxValue === null || numeric > maxValue) maxValue = numeric;
    }
    return maxValue;
  }

  async deleteItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const docArray = getOrCreateDocArray(this.collection);
    const index = docArray.findIndex((doc) => doc[keyToLookup] === itemValue);
    if (index === -1) return { acknowledged: true, deletedCount: 0 };
    docArray.splice(index, 1);
    return { acknowledged: true, deletedCount: 1 };
  }
}

//---------- internal helpers ----------

const getOrCreateDocArray = (collection) => {
  if (!collectionMap.has(collection)) collectionMap.set(collection, []);
  return collectionMap.get(collection);
};

const findFirstDoc = (collection, matchObj) => {
  for (const doc of readCollection(collection)) {
    if (docMatches(doc, matchObj)) return doc;
  }
  return null;
};

const docMatches = (doc, matchObj) => {
  for (const key of Object.keys(matchObj)) {
    if (doc[key] !== matchObj[key]) return false;
  }
  return true;
};

const stripDollarKeys = (updateObj) => {
  const safeObj = {};
  for (const key of Object.keys(updateObj)) {
    if (!key.startsWith("$")) safeObj[key] = updateObj[key];
  }
  return safeObj;
};
