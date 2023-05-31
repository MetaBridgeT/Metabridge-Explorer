const Web3 = require("web3");
const PubSub = require("pubsub-js");
const fs = require("fs");
const Mongo = require('../helpers/mongo')

const web3 = new Web3("https://eth-rpc-api-testnet.thetatoken.org/rpc");
const contractAddress = "0xa6115196F79E6ee3B7990D3e0AcA0c3627C43743"; // replace with your contract address
const eventName = "ExternalCall"; // replace with your event name
const topic = `${contractAddress}.${eventName}`;
const abi = JSON.parse(fs.readFileSync("./abis/bridgecore.json"));

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
          const nonce = event.returnValues.nonce
          event.returnValues.txHash = event.transactionHash;
          console.log(`TxHash: ${event.transactionHash}`)
          global.gEcallState[nonce] = true
          Mongo.upsert(event.returnValues, false)
          PubSub.publish(topic, event.returnValues);
        });
  
        latestBlock = currentBlock;
      }
    }catch(e){
      console.error(`listen-external-call: ${e}`)
    }
  }, 200);
};

module.exports = {
  topic, listen
};
