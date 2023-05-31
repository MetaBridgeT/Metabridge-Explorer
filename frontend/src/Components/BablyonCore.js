import { useEffect, useRef, useState } from "react";
import { Engine, Scene } from "@babylonjs/core";
import { useSearchParams } from "react-router-dom";

export default ({
  antialias,
  engineOptions,
  adaptToDeviceRatio,
  sceneOptions,
  onRender,
  onSceneReady,
  txHash,
  setResetSwitch,
  onVideoTaskCreated,
  setLoader,
  ...rest
}) => {
  const reactCanvas = useRef(null);
  const [hw, setHW] = useState({ h: 0, w: 0 });
  const [searchParams] = useSearchParams();
  // set up basic engine and scene
  useEffect(() => {
    if (window) {
      setHW({
        h: window.innerHeight,
        w: window.innerWidth,
      });
    }
    const { current: canvas } = reactCanvas;

    if (!canvas) return;

    const engine = new Engine(
      canvas,
      antialias,
      engineOptions,
      adaptToDeviceRatio
    );
    const scene = new Scene(engine, sceneOptions);
    if (scene.isReady()) {
      onSceneReady(scene, txHash, setLoader, searchParams.get('isVideo'), onVideoTaskCreated);
    } else {
      scene.onReadyObservable.addOnce((scene) => onSceneReady(scene, txHash, setLoader, searchParams.get('isVideo'), onVideoTaskCreated));
    }

    engine.runRenderLoop(() => {
      if (typeof onRender === "function") onRender(scene);
      scene.render();
    });

    const resize = () => {
      if (window) {
        setHW({
          h: window.innerHeight,
          w: window.innerWidth,
        });
      }
      scene.getEngine().resize();
    };

    if (window) {
      window.addEventListener("resize", resize);
    }

    return () => {
      scene.getEngine().dispose();
      scene.dispose()
      if (window) {
        window.removeEventListener("resize", resize);
      }
    };
  }, [
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    onSceneReady,
  ]);

  return <canvas ref={reactCanvas} {...rest} height={hw.h} width={hw.w} />;
};
