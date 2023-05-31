const Web3 = require("web3");
const PubSub = require("pubsub-js");
const fs = require("fs");
const Mongo = require('../helpers/mongo')
const web3 = new Web3("http://34.125.48.173:19887");
const contractAddress = "0x0293801741ceF9465b2cf717578e57255863E8B2"; // replace with your contract address
const eventName0 = "TransactionAdded"
const eventName = "TransactionVotes"; // replace with your event name
const eventName1 = "TransactionCompleted"
const topic = `${contractAddress}.${eventName}.${eventName1}`;
const abi = JSON.parse(fs.readFileSync("./abis/subchain.json"));

const contract = new web3.eth.Contract(abi, contractAddress);

const listen = () => {
  let latestBlock = -1;

  // Function to fetch the data from the RPC server every 6 seconds
  setInterval(async () => {
    try{
      const currentBlock = await web3.eth.getBlockNumber();
      if (latestBlock == -1) {
        latestBlock = currentBlock - 1;
      }
      if (currentBlock > latestBlock) {

        const events0 = await contract.getPastEvents(eventName0, {
          fromBlock: latestBlock + 1,
          toBlock: currentBlock,
        });
  
        events0.forEach((event) => {
          console.log(
            `Received ${eventName} event with data: ${JSON.stringify(
              event.returnValues
            )}`
          );
          event.returnValues.yesVotes = '0'
          event.returnValues.totalVotes = '1'
          event.returnValues.sender = ''
          event.returnValues.nonce = event.returnValues.index
          event.returnValues.type = eventName
          Mongo.upsert(event.returnValues, true)
          PubSub.publish(topic, event.returnValues);
        });
  

        const events = await contract.getPastEvents(eventName, {
          fromBlock: latestBlock + 1,
          toBlock: currentBlock,
        });
  
        events.forEach((event) => {
          console.log(
            `Received ${eventName} event with data: ${JSON.stringify(
              event.returnValues
            )}`
          );
          event.returnValues.nonce = event.returnValues.index
          event.returnValues.type = eventName
          Mongo.upsert(event.returnValues, true)
          PubSub.publish(topic, event.returnValues);
        });
  
        const events1 = await contract.getPastEvents(eventName1, {
          fromBlock: latestBlock + 1,
          toBlock: currentBlock,
        });
  
        events1.forEach((event) => {
          console.log(
            `Received ${eventName} event with data: ${JSON.stringify(
              event.returnValues
            )}`
          );
          event.returnValues.nonce = event.returnValues.index
          event.returnValues.type = eventName1
          setTimeout(()=>{
            delete global.gEcallState[event.index]
          },60000)
          Mongo.upsert(event.returnValues, true)
          PubSub.publish(topic, event.returnValues);
        });
  
        latestBlock = currentBlock;
      }
    }catch(e){
      console.error(`listen-quorum-call: ${e}`)
    }
  }, 200);
};

module.exports = {
  topic, listen
};
