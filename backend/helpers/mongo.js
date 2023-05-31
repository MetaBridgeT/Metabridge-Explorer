const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;
const dbName = 'theta-viz';
const collectionName = 'data';

const client_ =  MongoClient.connect(uri)

async function upsert(data, isQueue) {
    try{
        const client = await client_;
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
    
        let query = { nonce: data.nonce }
    
        const update = isQueue
            ? { $push: { queue: data } }
            : { $set: { txHash: data.txHash, eCall: data } };
    
        await collection.updateOne(query, update, { upsert: true });
    }catch(e){
        console.error(`mongo-upsert: ${e}`)
    }
}

async function getData(txHash) {
    try{
        const client = await client_;
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
      
        const query = { txHash };
        const result = await collection.findOne(query);
      
        return result;
    }catch(e){
        console.error(`Mongo-getData: ${e}`)
    }
}

module.exports = { upsert, getData };
