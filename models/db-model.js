//import mongo
import { dbConnect, dbGet } from "../config/db.js";
import { ObjectId } from "mongodb";

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
    const updateData = await dbGet().collection(this.collection).updateOne({ [keyToLookup]: itemValue }, { $set: { ...updateObj } }); //prettier-ignore
    return updateData;
  }

  //---------------

  async matchMultiItems() {
    const { keyToLookup1, keyToLookup2, keyToLookup3, itemValue1, itemValue2, itemValue3 } = this.dataObject;

    const matchData = await dbGet().collection(this.collection).findOne({ [keyToLookup1]: itemValue1, [keyToLookup2]: itemValue2, [keyToLookup3]: itemValue3 }); //prettier-ignore
    return matchData;
  }

  //----------------

  async getAll() {
    const arrayData = await dbGet().collection(this.collection).find().toArray();
    return arrayData;
  }

  async getUniqueItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const dataArray = await dbGet().collection(this.collection).findOne({ [keyToLookup]: itemValue }); //prettier-ignore
    return dataArray;
  }

  //--------------

  async deleteItem() {
    const { keyToLookup, itemValue } = this.dataObject;
    const deleteData = await dbGet().collection(this.collection).deleteOne({ [keyToLookup]: itemValue }); //prettier-ignore
    return deleteData;
  }
}

export default dbModel;
