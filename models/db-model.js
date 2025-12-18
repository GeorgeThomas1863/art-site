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
}

export default dbModel;
