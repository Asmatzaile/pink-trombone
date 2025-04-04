import { useEffect, useRef, useState } from "react";
import { AudioSystem, Glottis, Tract } from "pink-trombone"
import { UI } from "./trombone-ui";

let init = false;

function App() {
  const [started, setStarted] = useState(false);
  const canvasContainerRef = useRef();
  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener("pointerdown", initialize, { once: true, signal: controller.signal })
    return () => controller.abort();
  }, []);

  const initialize = () => {
    if (init) return;
    init = true;
    setStarted(true);
    AudioSystem.init();
    Glottis.init();
    Tract.init();
    const { tractCanvas } = UI.init(AudioSystem, Glottis, Tract);
    tractCanvas.className = "w-full h-full absolute inset-0"
    AudioSystem.start();
    Glottis.isTouched = true;
  }
  
  useEffect(() => {
    if (!started) return;
    canvasContainerRef.current.append(UI.backCanvas, UI.tractCanvas);
  }, [started])

  if (!started) return <>
  <div className='h-dvh grid place-items-center cursor-pointer'>Click anywhere to start.</div>
  </>
  return (
    <div className='h-dvh grid place-items-center'>
      <p> Demo app for headless <a className="cursor-pointer" href="https://dood.al/pinktrombone/">Pink Trombone</a>.</p>
      <div ref={canvasContainerRef} className="pointer relative max-h-full aspect-square inset-0.5 -translate-0.5" />
    </div>
  )
}

export default App
