import React, { useState } from "react";
import { MutatingDots } from "react-loader-spinner";
import {
  FreeCamera,
  Vector3,
  Color4,
  MeshBuilder,
  SceneLoader,
  DefaultRenderingPipeline,
  PBRMaterial,
  Scene,
  AnimationGroup,
  Mesh,
  Texture,
  ParticleSystem,
  TransformNode,
  DynamicTexture,
  StandardMaterial,
  AmmoJSPlugin,
  PhysicsImpostor,
  ActionManager,
  ExecuteCodeAction,
  Animation,
  Database,
  VideoRecorder,
} from "@babylonjs/core";
import BablyonCore from "../Components/BablyonCore"; // uses above component in same directory
import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";
import "@babylonjs/core/Debug/debugLayer";
import { randomIntFromInterval } from "../helpers/utils";
import {
  AdvancedDynamicTexture,
  Control,
  Rectangle,
  TextBlock,
} from "@babylonjs/gui";
import { default as Ammo } from "ammo.js/builds/ammo";
import { useParams } from "react-router-dom";
import HeaderBar from "../Components/HeaderBar";
import Popup from "../Components/Popup";
import { connectAndMint } from "../helpers/test-call";

const WS_URL = "wss://api.metabridge.network/data-Viz";
const API = "https://api.metabridge.network/";
Ammo();

Database.IDBStorageEnabled = true;

/** @type {TransformNode} */
let eCallBox;
/** @type {TransformNode} */
let drone;
/** @type {Mesh} */
let sphere;
/** @type {TransformNode} */
let sphereDrone;

/** @type {AnimationGroup} */
let travelAg;
/** @type {AnimationGroup} */
let droneLandingAg;
/** @type {AnimationGroup} */
let dronepathAg;
/** @type {AnimationGroup} */
let dornefanAg;
/** @type {AnimationGroup} */
let dronemotion1Ag;
/** @type {AnimationGroup} */
let dronemotion2Ag;
/** @type {AnimationGroup} */
let dronemotion3Ag;
/** @type {AnimationGroup} */
let spherefoAg;
/** @type {AnimationGroup} */
let dronesphereAg;

let tx_data = {};

let h = 0;
//let testDelay = 0;
/**
 *
 *
 * @param {Scene} scene
 * @param {String} nonce
 * @param {WebSocket} ws
 */
const boxController = (scene, nonce, ws) => {
  let spawned = eCallBox.clone(null, scene.getTransformNodeByName("boxempty"));

  let spawned_drone = drone.clone(
    null,
    scene.getTransformNodeByName("drone_empty")
  );

  const stars = new ParticleSystem("stars", 1000, scene);
  stars.particleTexture = new Texture("magic_05.png", scene);
  stars.emitter = spawned;
  stars.minEmitBox = new Vector3(-2, 0, -2);
  stars.maxEmitBox = new Vector3(2, 0, 2);
  stars.color1 = new Color4(1, 1, 1, 1);
  stars.color2 = new Color4(1, 1, 1, 0);
  stars.colorDead = new Color4(0, 0, 0, 0);
  stars.minSize = 0.1;
  stars.maxSize = 0.5;
  stars.minLifeTime = 0.5;
  stars.maxLifeTime = 1.5;
  stars.emitRate = 200;
  stars.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  stars.gravity = new Vector3(0, -9.81, 0);
  stars.direction1 = new Vector3(-1, 4, 1);
  stars.direction2 = new Vector3(1, 4, -1);
  stars.minAngularSpeed = -Math.PI / 4;
  stars.maxAngularSpeed = Math.PI / 4;
  stars.minEmitPower = 1;
  stars.maxEmitPower = 3;

  let dAg1 = droneLandingAg.clone(null, (oldTarget) => {
    if (oldTarget.name == "drone_armature") {
      return spawned_drone;
    }
    for (let tn of spawned_drone.getChildTransformNodes()) {
      if (tn.name.includes(oldTarget.name)) {
        return tn;
      }
    }
    return oldTarget;
  });

  let dAg2 = dronepathAg.clone(null, (oldTarget) => {
    if (oldTarget.name == "drone_armature") {
      return spawned_drone;
    }
    for (let tn of spawned_drone.getChildTransformNodes()) {
      if (tn.name == oldTarget.name) {
        return tn;
      }
    }
    return oldTarget;
  });
  let dAg3;
  let anim_n = randomIntFromInterval(1, 3);
  if (anim_n == 1) {
    dAg3 = dronemotion1Ag.clone(null, (oldTarget) => {
      if (oldTarget.name == "drone_armature") {
        return spawned_drone;
      }
      for (let tn of spawned_drone.getChildTransformNodes()) {
        if (tn.name.includes(oldTarget.name)) {
          return tn;
        }
      }
      return oldTarget;
    });
  } else if (anim_n == 2) {
    dAg3 = dronemotion2Ag.clone(null, (oldTarget) => {
      if (oldTarget.name == "drone_armature") {
        return spawned_drone;
      }
      for (let tn of spawned_drone.getChildTransformNodes()) {
        if (tn.name.includes(oldTarget.name)) {
          return tn;
        }
      }
      return oldTarget;
    });
  } else {
    dAg3 = dronemotion3Ag.clone(null, (oldTarget) => {
      if (oldTarget.name == "drone_armature") {
        return spawned_drone;
      }
      for (let tn of spawned_drone.getChildTransformNodes()) {
        if (tn.name.includes(oldTarget.name)) {
          return tn;
        }
      }
      return oldTarget;
    });
  }
  tx_data[nonce].tfuel_drones = { dAg1, dAg2, dAg3, spawned_drone };

  dAg1.onAnimationGroupEndObservable.add(() => {
    dAg2.onAnimationGroupEndObservable.add(() => {
      dAg3.start(true, 1.0, dAg3.from, dAg3.to, false);
    });
    dAg2.play();
  });

  //dfAg.start(true, 1, dfAg.from, dfAg.to, false)
  dAg1.play();

  let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  advancedTexture.useInvalidateRectOptimization = false;

  let rect1 = new Rectangle();
  advancedTexture.addControl(rect1);
  rect1.width = "150px";
  rect1.height = "58px";
  rect1.linkOffsetY = "-150px";
  rect1.background = "rgba(1,1,1,0.5)";
  rect1.cornerRadius = 5;
  rect1.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
  rect1.thickness = 0;

  rect1.linkWithMesh(spawned);

  let text1 = new TextBlock();
  text1.text = `Tx Hahsh: ${tx_data[nonce].eCall.txHash}`;
  text1.color = "#04d9ff";
  text1.fontSize = 12;
  text1.fontWeight = "bold";
  text1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
  text1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // set text alignment to left
  text1.top = 2;

  let text2 = new TextBlock();
  text2.text = `From: ${tx_data[nonce].eCall.caller}`;
  text2.color = "#04d9ff";
  text2.fontSize = 12;
  text2.fontWeight = "bold";
  text2.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // set text alignment to left
  text2.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // set text alignment to left
  text2.top = 16;

  let text3 = new TextBlock();
  text3.text = `To: ${tx_data[nonce].eCall.contractAddress}`;
  text3.color = "#04d9ff";
  text3.fontSize = 12;
  text3.fontWeight = "bold";
  text3.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // set text alignment to left
  text3.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // set text alignment to left
  text3.top = 30;

  let text4 = new TextBlock();
  text4.text = `To ChainId: ${tx_data[nonce].eCall.chainid}`;
  text4.color = "#04d9ff";
  text4.fontSize = 12;
  text4.fontWeight = "bold";
  text4.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; // set text alignment to left
  text4.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; // set text alignment to left
  text4.top = 44;

  rect1.addControl(text1);
  rect1.addControl(text2);
  rect1.addControl(text3);
  rect1.addControl(text4);

  let j = travelAg.clone(null, (oldTarget) => {
    if (oldTarget.name == "box_travel") {
      return spawned;
    } else {
      return oldTarget;
    }
  });
  j.onAnimationGroupEndObservable.add(() => {
    stars.start();
    ws.send(
      JSON.stringify({
        nonce,
        action: "ON_BOX_REACH",
      })
    );
    setTimeout(() => {
      rect1.dispose();
      advancedTexture.dispose();
      scene.removeParticleSystem(stars);
      scene.removeAnimationGroup(j);
      spawned.dispose();
    }, 1500);
  });
  j.play();
};

const emojiList = [
  "😍", // Smiling Face with Heart-Eyes
  "❤️", // Red Heart
  "💖", // Sparkling Heart
  "😘", // Face Blowing a Kiss
  "😊", // Smiling Face with Smiling Eyes
  "😃", // Grinning Face with Big Eyes
  "😄", // Grinning Face with Smiling Eyes
  "😆", // Grinning Squinting Face
  "😂", // Face with Tears of Joy
  "🤣", // Rolling on the Floor Laughing
  "😹", // Cat with Tears of Joy
  "🥰", // Smiling Face with Hearts
  "😻", // Smiling Cat with Heart-Eyes
  "👍", // Thumbs Up Sign
  "✌️", // Victory Hand
  "🏆", // Trophy
  "🎉", // Party Popper
  "🥳", // Partying Face
  "🎊", // Confetti Ball
  "🚀", // Rocket
  "💯", // Hundred Points
  "🙌", // Raising Hands
  "👏", // Clapping Hands
];

/**
 *
 *
 * @param {Scene} scene
 */
const sphereController = (scene, nonce) => {
  let spawned = sphere.clone();
  spawned.parent = null;
  spawned.position = sphere.getAbsolutePosition();
  spawned.setEnabled(true);
  spawned.physicsImpostor = new PhysicsImpostor(
    spawned,
    PhysicsImpostor.BoxImpostor,
    { mass: 0.001, restitution: 0 },
    scene
  );
  spawned.physicsImpostor.registerOnPhysicsCollide(
    spawned.physicsImpostor,
    (otherImpostor) => {
      let origP = sphere.getAbsolutePosition();
      spawned.position = new Vector3(origP.x, spawned.position.y, origP.z);
    }
  );

  tx_data[nonce].sphere = spawned;

  var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  advancedTexture.useInvalidateRectOptimization = false;

  let rect1 = new Rectangle();
  advancedTexture.addControl(rect1);
  rect1.width = "800px";
  rect1.height = "30px";
  rect1.thickness = 2;
  rect1.linkOffsetY = "-100px";
  rect1.transformCenterY = 1;
  rect1.background = "white";
  rect1.alpha = 0.5;
  rect1.scaleX = 0;
  rect1.scaleY = 0;
  rect1.cornerRadius = 5;
  rect1.linkWithMesh(spawned);

  let text1 = new TextBlock();
  text1.text = `TxHash : ${tx_data[nonce].eCall.txHash}`;
  text1.color = "red";
  text1.fontSize = 18;
  text1.textWrapping = true;
  text1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  text1.background = "#006994";
  rect1.addControl(text1);
  text1.alpha = 1 / text1.parent.alpha;

  let actionManager = new ActionManager(scene);
  spawned.actionManager = actionManager;

  let scaleXAnimation = new Animation(
    "myAnimation",
    "scaleX",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  let scaleYAnimation = new Animation(
    "myAnimation",
    "scaleY",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  var keys = [];

  keys.push({
    frame: 0,
    value: 0,
  });
  keys.push({
    frame: 10,
    value: 1,
  });

  scaleXAnimation.setKeys(keys);
  scaleYAnimation.setKeys(keys);
  rect1.animations = [];
  rect1.animations.push(scaleXAnimation);
  rect1.animations.push(scaleYAnimation);

  actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, function (ev) {
      scene.beginAnimation(rect1, 0, 10, false);
    })
  );
  //if hover is over remove highlight of the mesh
  actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, function (ev) {
      scene.beginAnimation(rect1, 10, 0, false);
    })
  );

  let spawned_sphere_drone = sphereDrone.clone(
    null,
    scene.getTransformNodeByName("spheredrone_empty")
  );
  spawned_sphere_drone.setEnabled(false);
  spawned.position.y += h;
  h += 3.2;
  let newFoAg = spherefoAg.clone(null, (oldTarget) => {
    if (oldTarget.name == "sphere_ani") {
      return spawned;
    }
    return oldTarget;
  });

  let spdBye = dronesphereAg.clone(null, (oldTarget) => {
    for (let tn of spawned_sphere_drone.getChildTransformNodes()) {
      if (tn.name.includes(oldTarget.name)) {
        return tn;
      }
    }
    return oldTarget;
  });

  let texture = new DynamicTexture(
    "texture",
    { width: 512, height: 256 },
    scene
  );

  const font = "bold 72px monospace";

  const updateSphereText = (val) => {
    texture.drawText(val + "%", 115, 120, font, "green", "white", true, true);
  };

  tx_data[nonce].updateSphereText = updateSphereText;
  /** @type {PBRMaterial} */
  let mat = spawned.material.clone();
  mat.albedoTexture = texture;
  mat.emissiveTexture = texture;

  spawned.material = mat;

  let stpRecord;

  spdBye.onAnimationGroupEndObservable.add(() => {
    spdBye.dispose();
    newFoAg.dispose();
    spawned.dispose();
    mat.dispose();
    texture.dispose();
    spawned_sphere_drone.dispose();
    delete tx_data[nonce];
    if (stpRecord) {
      setTimeout(() => {
        stpRecord();
      }, 1000);
    }
  });

  let endSpeherePhase = (stopRecord) => {
    stpRecord = stopRecord;
    texture.uAng = Math.PI;
    texture.wAng = Math.PI;

    let tCtx = texture.getContext();
    tCtx.fillStyle = "#39FF14";
    tCtx.fillRect(0, 0, 512, 256);
    texture.update();
    const font1 = "bold 48px monospace";
    texture.drawText(
      emojiList[randomIntFromInterval(0, emojiList.length - 1)] + "Done",
      80,
      120,
      font1,
      "white",
      null,
      true,
      true
    );

    for (let m of spawned_sphere_drone.getChildMeshes()) {
      //console.log(m.name)
      if (m.name.includes("Sphere")) {
        m.material = mat;
        break;
      }
    }
    spawned_sphere_drone.setEnabled(true);
    spawned.parent = scene.getMeshByName("__root__");
    spawned.physicsImpostor.dispose();
    h -= 3.2;

    if (tx_data[nonce].tfuel_drones) {
      const { dAg1, dAg2, dAg3, spawned_drone } = tx_data[nonce].tfuel_drones;
      dAg1.dispose();
      dAg2.dispose();
      dAg3.dispose();
      spawned_drone.dispose();
    }
    newFoAg.play();
    spdBye.play();
  };
  tx_data[nonce].endSpeherePhase = endSpeherePhase;
  //testDelay += 2000;
};

/**
 *
 *
 * @param {Scene} scene
 */
const createTravelAg = (scene) => {
  travelAg = new AnimationGroup("my_tarvelAg");
  for (let ta of scene.getAnimationGroupByName("box_travelAction")
    .targetedAnimations) {
    travelAg.addTargetedAnimation(ta.animation, ta.target);
  }
  for (let ta of scene.getAnimationGroupByName("ArmatureAction")
    .targetedAnimations) {
    travelAg.addTargetedAnimation(ta.animation, ta.target);
  }
};

/**
 *
 *
 * @param {Scene} scene
 */
const createDroneAg = (scene) => {
  droneLandingAg = scene.getAnimationGroupByName("dronelanding");
  dronepathAg = scene.getAnimationGroupByName("dronepath");
  dronemotion1Ag = scene.getAnimationGroupByName("dronemotion1");
  dronemotion2Ag = scene.getAnimationGroupByName("dronemotion2");
  dronemotion3Ag = scene.getAnimationGroupByName("dronemotion3");

  dornefanAg = scene.getAnimationGroupByName("drone_fansani");
  for (let ta of dornefanAg.targetedAnimations) {
    dronemotion1Ag.addTargetedAnimation(ta.animation, ta.target);
    dronemotion2Ag.addTargetedAnimation(ta.animation, ta.target);
    dronemotion3Ag.addTargetedAnimation(ta.animation, ta.target);
  }
};

/**
 *
 *
 * @param {Scene} scene
 */
const createSphereAg = (scene) => {
  let veselAg = scene.getAnimationGroupByName("vessel_armature");
  spherefoAg = scene.getAnimationGroupByName("sphere_ani");
  dronesphereAg = scene.getAnimationGroupByName("dronesphere");
  for (let ta of veselAg.targetedAnimations) {
    spherefoAg.addTargetedAnimation(ta.animation, ta.target);
  }
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 *
 *
 * @param {Scene} scene
 * @param {Number} index
 * @param {String} text
 */
const toolTipOnCabinet = (scene, index, text) => {
  if (index != 0) {
    index = `.00${index}`;
  } else {
    index = "";
  }
  let cabinet = scene.getTransformNodeByName(`cabinet${index}`);
  var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  advancedTexture.useInvalidateRectOptimization = false;

  let rect1 = new Rectangle();
  advancedTexture.addControl(rect1);
  rect1.width = "100px";
  rect1.height = "30px";
  rect1.thickness = 2;
  rect1.linkOffsetY = "-100px";
  rect1.transformCenterY = 1;
  rect1.background = "white";
  rect1.alpha = 0.5;
  rect1.cornerRadius = 5;
  rect1.linkWithMesh(cabinet);

  let text1 = new TextBlock();
  text1.text = text;
  text1.fontWeight = "bold";
  text1.color = "red";
  text1.fontSize = 18;
  text1.textWrapping = true;
  text1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
  //text1.background = "#006994";
  rect1.addControl(text1);
  text1.alpha = 1 / text1.parent.alpha;

  setTimeout(() => {
    rect1.dispose();
    advancedTexture.dispose();
  }, 1500);
};

/**
 *
 *
 * @param {Scene} scene
 * @param {String} txHash
 * @param {Function} setLoader
 * @param {Boolean} isVideo
 * @param {Function} onVideoTaskCreated
 */
const onSceneReady = async (
  scene,
  txHash,
  setLoader,
  isVideo,
  onVideoTaskCreated
) => {
  //scene.debugLayer.show({ embedMode: false });
  scene.clearColor = new Color4(0, 0, 0, 1);

  // This creates and positions a free camera (non-mesh)
  const camera = new FreeCamera("camera1", new Vector3(8, 14, -14), scene);
  camera.inputs.remove(camera.inputs.attached.keyboard);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  /*const light = new DirectionalLight("light", new Vector3(0, -1, 0), scene);
  light.position = new Vector3(0, 20, 0)  
  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 5;*/

  // Enable bloom
  const postProcess = new DefaultRenderingPipeline(
    "default", // Name
    true, // HDR
    scene, // Scene
    [camera] // Cameras to apply bloom to
  );
  postProcess.bloomEnabled = true;

  postProcess.bloomThreshold = 0.3; // Adjust to control the threshold for what is considered "bright"
  postProcess.bloomWeight = 0.025; // Adjust to control the intensity of the bloom effect
  postProcess.bloomKernel = 64; // Adjust to control the size of the bloom kernel

  const importPromise = await SceneLoader.ImportMeshAsync(
    "",
    "/metabridge.glb",
    "",
    scene
  );
  importPromise.meshes[0].rotate(new Vector3(0, 1, 0), toRadians(180));
  if (!isVideo) {
    setLoader(false);
  }

  /** @type {PBRMaterial} */
  let mat = scene.getMaterialByName("circuit");
  mat.emissiveIntensity = 1;

  const physicsPlugin = new AmmoJSPlugin(false);
  scene.enablePhysics(new Vector3(0, -9.81, 0), physicsPlugin);

  eCallBox = scene
    .getTransformNodeByName("boxempty")
    .getChildTransformNodes()[0];
  eCallBox.setEnabled(false);
  drone = scene
    .getTransformNodeByName("drone_empty")
    .getChildTransformNodes()[0];
  drone.setEnabled(false);
  sphere = scene.getMeshByName("sphere_ani");
  sphere.setEnabled(false);
  sphereDrone = scene
    .getTransformNodeByName("spheredrone_empty")
    .getChildTransformNodes()[0];
  sphereDrone.setEnabled(false);

  let vessel_base = scene.getMeshByName("vessel_primitive0");
  var ground = MeshBuilder.CreateBox(
    "ground",
    { width: 5, height: 0.1, depth: 5 },
    scene
  );

  ground.position = vessel_base.getAbsolutePosition();
  ground.position.y = 1.45;
  let transperentMat = new StandardMaterial();
  transperentMat.alpha = 0;
  ground.material = transperentMat;

  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0 },
    scene
  );
  ground.rotate(new Vector3(0, 1, 0), Math.PI / 2);
  createTravelAg(scene);
  createDroneAg(scene);
  createSphereAg(scene);

  /** @type {PBRMaterial} */
  let door_mat = scene.getMaterialByName("door");
  door_mat.albedoColor = "#BBBBBB";
  door_mat.emissiveColor = "#999999";

  //gui = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

  //setInterval(() => {
  //boxController(scene, "1");
  //sphereController(scene);
  //}, 3000);

  /*setInterval(() => {
    toolTipOnCabinet(scene, randomIntFromInterval(0, 4), "Voted!");
  }, 2000);*/

  //console.log(eCallBox.getScene().getAnimationGroupByName("box_travelAction"))

  for (let ag of importPromise.animationGroups) {
    if (
      ![
        "box_travelAction",
        "dronelanding",
        "dronepath",
        "dronemotion1",
        "dronemotion2",
        "dronemotion3",
        "drone_fansani",
        "ArmatureAction",
        "sphere_ani",
        "vessel_armature",
        "dronesphere",
      ].includes(ag.name)
    ) {
      ag.start(true, 1.0, ag.from, ag.to, false);
    }
  }

  /** @type {VideoRecorder} */
  let recorder;
  if (isVideo) {
    if (VideoRecorder.IsSupported(scene.getEngine())) {
      camera.rotation = new Vector3(toRadians(35.08), toRadians(-44.91), 0);
      recorder = new VideoRecorder(scene.getEngine());
      recorder.startRecording(null, 0).then(async (videoBlob) => {
        const formData = new FormData();
        formData.append("video", videoBlob, "video.webm");

        // Send a POST request to the Express.js endpoint with the FormData object as the request body
        const response = await (
          await fetch(`${API}/upload`, {
            method: "POST",
            body: formData,
          })
        ).json();

        let taskId = response.taskId;
        setLoader(false);
        onVideoTaskCreated(taskId);
      });
    }
  }

  let stopRecord = () => {
    recorder.stopRecording();
  };

  // test txHash: 0x0003d4161eb7df319ed016de0710cda2d04964b76a2a0a0b2d24a55ec2d7baea
  let wsUrl = WS_URL;
  if (txHash) {
    wsUrl += `?txHash=${txHash}`;
  }

  let socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);
    const nonce = data.nonce;
    if (data.action == "MOVE_BOX") {
      console.log(`Recived nonce: ${nonce}`);
      tx_data[nonce] = {
        eCall: data,
        sphereCreated: false,
      };
      boxController(scene, nonce, socket);
    } else if (data.action == "QUORUM_UPDATE") {
      if (!tx_data[nonce].sphereCreated) {
        tx_data[nonce].sphereCreated = true;
        sphereController(scene, nonce);
      }
      let ptage = parseInt(data.yesVotes) / parseInt(data.totalVotes);
      toolTipOnCabinet(scene, randomIntFromInterval(0, 4), "Voted!");
      tx_data[nonce].updateSphereText(ptage * 100);
    } else if (data.action == "TRANSACTION_COMPLETED") {
      if (isVideo) {
        tx_data[nonce].endSpeherePhase(stopRecord);
      } else {
        tx_data[nonce].endSpeherePhase(null);
      }
    }
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      alert(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      alert("[close] Connection died");
    }
  };

  socket.onerror = function (error) {
    alert(`[error]`);
  };
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene) => {};

export default () => {
  const [isLoading, setLoader] = useState(true);
  const [pType, setPtype] = useState("");
  const [txData, setTxData] = useState({
    txHash: "",
    videoId: "",
  });
  const routeParams = useParams();

  const onVideoTaskCreated = (taskId) => {
    setPtype("p1");
    let c = setInterval(async () => {
      let r = await (await fetch(`${API}/video-api/task/${taskId}`)).json();
      if (r.status) {
        const videoData = r.videoData;
        console.log(videoData);

        clearInterval(c);
        let d = setInterval(async () => {
          let r = await (
            await fetch(`${API}/video-api/status/${videoData.id}`)
          ).json();
          if (r.state == "success") {
            setPtype("p2");
            let result = await connectAndMint(
              `https://player.thetavideoapi.com/video/${videoData.id}`
            );
            setTxData({
              txHash: result,
              videoId: videoData.id,
            });
            // just test repalce with p2
            setPtype("p3");
            clearInterval(d);
          }
        }, 5000);
      }
    }, 5000);
  };

  return (
    <div>
      <Popup ptype={pType} txData={txData} />
      <HeaderBar />
      {isLoading && (
        <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
          <MutatingDots
            height="100"
            width="100"
            color="#ed8936"
            secondaryColor="#ed8936"
            radius="12.5"
            ariaLabel="mutating-dots-loading"
            visible={true}
          />
        </div>
      )}
      <BablyonCore
        antialias
        onSceneReady={onSceneReady}
        onRender={onRender}
        setLoader={setLoader}
        onVideoTaskCreated={onVideoTaskCreated}
        txHash={routeParams?.id}
        id="my-canvas"
      />
    </div>
  );
};
