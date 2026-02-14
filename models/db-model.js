//import mongo
import { dbConnect, dbGet } from "../middleware/db-config.js";
// import { ObjectId } from "mongodb";
import { sanitizeMongoValue } from "../src/sanitize.js";

//connect to db AGAIN here just to be safe
await dbConnect();

class dbModel {
  constructor(dataObject, collection) {
    this.dataObject = dataObject;
    this.collection = collection;
  }

  //STORE STUFF

  async storeAny() {
    // await db.dbConnect();
    const storeData = await dbGet().collection(this.collection).insertOne(this.dataObject);
    return storeData;
  }

  async updateObjItem() {
    const { keyToLookup, itemValue, updateObj } = this.dataObject;
    const safeValue = sanitizeMongoValue(itemValue);
    // Strip any $-prefixed keys from the update object
    const safeUpdateObj = {};
    for (const key of Object.keys(updateObj)) {
      if (!key.startsWith("$")) safeUpdateObj[key] = updateObj[key];
    }
    const updateData = await dbGet().collection(this.collection).updateOne({ [keyToLookup]: safeValue }, { $set: { ...safeUpdateObj } }); //prettier-ignore
    return updateData;
  }

  //---------------

  async matchMultiItems() {
    const { keyToLookup1, keyToLookup2, keyToLookup3, itemValue1, itemValue2, itemValue3 } = this.dataObject;
    const safe1 = sanitizeMongoValue(itemValue1);
    const safe2 = sanitizeMongoValue(itemValue2);
    const safe3 = sanitizeMongoValue(itemValue3);
    const matchData = await dbGet().collection(this.collection).findOne({ [keyToLookup1]: safe1, [keyToLookup2]: safe2, [keyToLookup3]: safe3 }); //prettier-ignore
    return matchData;
  }

  //----------------

  async getAll() {
    const arrayData = await dbGet().collection(this.collection).find().toArray();
    return arrayData;
  }

  async getUniqueItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const safeValue = sanitizeMongoValue(itemValue);
    const dataArray = await dbGet().collection(this.collection).findOne({ [keyToLookup]: safeValue }); //prettier-ignore
    return dataArray;
  }

  async getMaxId() {
    const keyToLookup = this.dataObject.keyToLookup;
    if (typeof keyToLookup !== "string") return null;
    const dataObj = await dbGet().collection(this.collection).find().sort({ [keyToLookup]: -1 }).limit(1).toArray(); //prettier-ignore

    if (!dataObj || !dataObj[0]) return null;

    return +dataObj[0][keyToLookup];
  }

  //--------------

  async deleteItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const safeValue = sanitizeMongoValue(itemValue);
    const deleteData = await dbGet().collection(this.collection).deleteOne({ [keyToLookup]: safeValue }); //prettier-ignore
    return deleteData;
  }
}

export default dbModel;
