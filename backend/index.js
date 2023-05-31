require("dotenv").config();
const express = require("express");
const expressWs = require("express-ws");
const PubSub = require("pubsub-js");
const cors = require("cors");
const multer = require("multer");
const fetch = require("node-fetch");
const { makeid } = require("./helpers/util");
const { createFFmpeg } = require("@ffmpeg/ffmpeg");
const fs = require("fs");
const Mongo = require("./helpers/mongo");

global.gEcallState = {};

const eCallEvent = require("./chain-events/listen-external-call");
const quorumEvent = require("./chain-events/listen-quorum-call");
const app = express();
app.use(cors());
const { app: wsApp } = expressWs(app);
const port = 3001;

// WebSocket endpoint
wsApp.ws("/data-Viz", async (ws, req) => {
  const txHash = req.query.txHash;
  let isBoxMovable = true;
  let eCallState = {};
  let boxQueue = [];
  let quorumQueueMap = {};
  let filterNonce = null;

  if (txHash) {
    try {
      const result = await Mongo.getData(txHash);
      const nonce = result?.nonce;
      if (nonce) {
        filterNonce = nonce;
        quorumQueueMap[nonce] = {
          isInProcess: false,
          vc: 0,
          tc: false,
          queue: [],
        };
        if (result.queue) {
          let queue = [];
          for (let event of result.queue) {
            if (event.type == "TransactionVotes") {
              if (parseInt(event.yesVotes) >= quorumQueueMap[nonce].vc) {
                quorumQueueMap[nonce].vc = parseInt(event.yesVotes);
                queue.push(event);
              }
            } else {
              if (!quorumQueueMap[nonce].tc) {
                quorumQueueMap[nonce].tc = true;
                queue.push(event);
              }
            }
          }
          quorumQueueMap[nonce].queue = queue;
        }
        const eCall = result.eCall;
        if (eCall) {
          eCall.action = "MOVE_BOX";
          eCallState[nonce] = true;
          isBoxMovable = false;
          setTimeout(() => {
            ws.send(JSON.stringify(eCall));
          }, 200);
        }
      }
    } catch (e) {
      console.error(`if txHash: ${e}`);
    }
  }

  const streamOutData = (nonce) => {
    let streamOutIntreval = setInterval(() => {
      try {
        if (
          quorumQueueMap.hasOwnProperty(nonce) &&
          quorumQueueMap[nonce].queue.length > 0
        ) {
          const event = quorumQueueMap[nonce].queue.shift();
          console.log(quorumQueueMap[nonce].queue);
          if (event.type == "TransactionCompleted") {
            if (quorumQueueMap[nonce].queue.length > 0) {
              quorumQueueMap[nonce].queue.push(event);
              return;
            }
            clearInterval(streamOutIntreval);
            delete quorumQueueMap[nonce];
            delete eCallState[nonce];
            event.action = "TRANSACTION_COMPLETED";
          } else {
            event.action = "QUORUM_UPDATE";
          }
          ws.send(JSON.stringify(event));
        }
      } catch (e) {
        console.error(`streamOutData: ${e}`);
      }
    }, 2000);
  };

  console.log("Client connected to WebSocket server");
  // Subscribe to the topic
  const subscription = PubSub.subscribe(eCallEvent.topic, (msg, data) => {
    try {
      console.log(
        `Received message on topic ${eCallEvent.topic}: ${JSON.stringify(data)}`
      );
      const nonce = data.nonce;
      if (txHash) {
        if (data.txHash == txHash) {
          filterNonce = data.nonce;
        } else {
          return;
        }
      }
      if (eCallState[nonce]) {
        console.log(`Duplicate Event for nonce ${nonce}`);
        return;
      }
      eCallState[nonce] = true;
      data.action = "MOVE_BOX";
      if (isBoxMovable) {
        isBoxMovable = false;
        ws.send(JSON.stringify(data));
      } else {
        boxQueue.push(JSON.stringify(data));
      }
    } catch (e) {
      console.error(`subscription: ${e}`);
    }
  });

  const subscription1 = PubSub.subscribe(quorumEvent.topic, (msg, data) => {
    try {
      console.log(
        `Received message on topic ${quorumEvent.topic}: ${JSON.stringify(
          data
        )}`
      );
      const nonce = data.nonce;
      if (txHash && filterNonce != nonce) {
        return;
      }
      if (!quorumQueueMap.hasOwnProperty(nonce)) {
        quorumQueueMap[nonce] = {
          vc: 0,
          tc: false,
          isInProcess: false,
          queue: [],
        };
      }
      if (data.type == "TransactionVotes") {
        if (parseInt(data.yesVotes) >= quorumQueueMap[nonce].vc) {
          quorumQueueMap[nonce].vc = parseInt(data.yesVotes);
          quorumQueueMap[nonce].queue.push(data);
        }
      } else {
        if (!quorumQueueMap[nonce].tc) {
          quorumQueueMap[nonce].tc = true;
          quorumQueueMap[nonce].queue.push(data);
        }
      }

      // This is for user who joins in-between
      if (
        !quorumQueueMap[nonce].isInProcess &&
        !eCallState.hasOwnProperty(nonce) &&
        global.gEcallState.hasOwnProperty(nonce)
      ) {
        quorumQueueMap[nonce].isInProcess = true;
        streamOutData(nonce);
      }
    } catch (e) {
      console.error(`subscription1: ${e}`);
    }
  });

  ws.on("message", function (msg) {
    try {
      const data = JSON.parse(msg);
      if (data.action == "ON_BOX_REACH") {
        const nonce = data.nonce;
        streamOutData(nonce);
        if (boxQueue.length > 0) {
          ws.send(boxQueue.shift());
        } else {
          isBoxMovable = true;
        }
      }
    } catch (e) {
      console.error(`ws.on.message: ${e}`);
    }
  });

  // Unsubscribe when client disconnects
  ws.on("close", () => {
    console.log("Client disconnected from WebSocket server");
    PubSub.unsubscribe(subscription);
    PubSub.unsubscribe(subscription1);
  });
});

const theta_app_id = "";  // Set theta app id here
const theta_app_sec = ""; // Set theta app sec here

app.get("/video-api/status/:id", async (req, res) => {
  const id = req.params.id;
  if (id) {
    const fRes = await fetch(`https://api.thetavideoapi.com/video/${id}`, {
      method: "GET",
      headers: {
        "x-tva-sa-id": theta_app_id,
        "x-tva-sa-secret": theta_app_sec,
      },
    });
    const fResJson = await fRes.json();
    res.send(fResJson.body.videos[0]);
    return;
  }
  res.send({});
});

app.get("/video-api/transcode/:id", async (req, res) => {
  const id = req.params.id;
  if (id) {
    const fRes = await fetch("https://api.thetavideoapi.com/video", {
      method: "POST",
      headers: {
        "x-tva-sa-id": theta_app_id,
        "x-tva-sa-secret": theta_app_sec,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_upload_id: id,
        playback_policy: "public",
      }),
    });
    const fResJson = await fRes.json();
    res.send(fResJson);
    return;
  }
  res.send({});
});

app.get("/video-api", async (req, res) => {
  const fRes = await fetch("https://api.thetavideoapi.com/upload", {
    method: "POST",
    headers: {
      "x-tva-sa-id": theta_app_id,
      "x-tva-sa-secret": theta_app_sec,
    },
  });
  const fResJson = await fRes.json();
  res.send(fResJson.body.uploads[0]);
});

const upload = multer();
const vidTasks = {};

app.get("/video-api/task/:id", async (req, res) => {
  const id = req.params.id;
  if (vidTasks[id]) {
    const data = vidTasks[id]
    if(vidTasks[id].videoData){
      delete vidTasks[id]
    }
    res.send(data);
    return;
  }
  res.send({});
});

app.post("/upload", upload.single("video"), async (req, res) => {
  // Get the video blob data from the request body
  const videoBlob = req.file.buffer;
  const VID = makeid(8);
  const longTask = async () => {
    // Create an instance of FFmpeg
    const ffmpeg = createFFmpeg({ log: true });
    const webmFile = `${VID}.webm`;
    const mp4File = `${VID}.mp4`;
    try {
      // Initialize FFmpeg
      await ffmpeg.load();

      // Write the video blob data to the FFmpeg input
      ffmpeg.FS("writeFile", webmFile, videoBlob);

      // Convert the video to mp4 using FFmpeg
      await ffmpeg.run(
        "-i",
        webmFile,
        "-movflags",
        "faststart",
        "-preset",
        "ultrafast",
        "-crf",
        "40",
        "-vf",
        'scale=1280:-2',
        mp4File
      );

      // Get the mp4 blob data from the FFmpeg output
      const mp4Blob = ffmpeg.FS("readFile", mp4File);
      /*fs.writeFile(mp4File, Buffer.from(mp4Blob.buffer), () =>
        console.log("video saved!")
      );
      fs.writeFile(webmFile, Buffer.from(videoBlob.buffer), () =>
        console.log("video saved!")
      );*/

      const fRes = await fetch("https://api.thetavideoapi.com/upload", {
        method: "POST",
        headers: {
          "x-tva-sa-id": theta_app_id,
          "x-tva-sa-secret": theta_app_sec,
        },
      });
      const fResJson = await fRes.json();
      const upload_data = fResJson.body.uploads[0];
      const presigned_url = upload_data.presigned_url;
      console.log(presigned_url);
      await fetch(presigned_url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream"
        },
        body: mp4Blob.buffer,
      });

      const ftRes = await fetch("https://api.thetavideoapi.com/video", {
        method: "POST",
        headers: {
          "x-tva-sa-id": theta_app_id,
          "x-tva-sa-secret": theta_app_sec,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_upload_id: upload_data.id,
          playback_policy: "public",
        }),
      });
      const ftResJson = await ftRes.json();
      const videoData = ftResJson.body.videos[0];
      vidTasks[VID].status = true;
      vidTasks[VID].videoData = videoData;
    } catch (error) {
      console.error(`Error processing video: ${error.message}`);
      res.status(500).json({ error: "Error processing video" });
    } finally {
      // Clean up the FFmpeg instance
      await ffmpeg.FS("unlink", webmFile);
      await ffmpeg.FS("unlink", mp4File);
    }
  };
  vidTasks[VID] = {
    status: false,
  };
  longTask();
  res.send({ taskId: VID });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}...`);
  eCallEvent.listen();
  quorumEvent.listen();
});
