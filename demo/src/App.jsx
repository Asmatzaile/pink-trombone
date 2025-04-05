import { useEffect, useRef, useState } from "react";
import { PinkTrombone } from "pink-trombone"
import { UI } from "./trombone-ui";

function App() {
  const [started, setStarted] = useState(false);
  const audioContextRef = useRef();
  const [trombones, setTrombones] = useState(new Set());

  const canvasContainerRef = useRef();
  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener("pointerdown", initialize, { once: true, signal: controller.signal })
    return () => controller.abort();
  }, []);

  const initialize = () => {
    audioContextRef.current =  new AudioContext();
    setStarted(true);
    const trombone = createTrombone();
    window.trombone = trombone; // for debugging
    const { tractCanvas } = UI.init(trombone);
    tractCanvas.className = "w-full h-full absolute inset-0"
  }

  const createTrombone = () => {
    const trombone = new PinkTrombone(audioContextRef.current);
    trombone.isVoiced = true;
    trombone.pitch = Math.random() * (64-41) + 41; // between F2 and E4
    setTrombones(p => {
      const n = new Set(p);
      n.add(trombone);
      return n;
    });
    trombone.delete = () => deleteTrombone(trombone);
    return trombone;
  }

  const deleteTrombone = (trombone) => {
    setTrombones(p => {
      const n = new Set(p);
      n.delete(trombone);
      return n;
    })
    trombone.dispose();
  }

  useEffect(() => {
    if (!started) return;
    canvasContainerRef.current.append(UI.backCanvas, UI.tractCanvas);
  }, [started])

  const tromboneDivs = [...trombones].map(t=> {
    return <div onClick={() => t.delete()}
      className=' bg-pink-300 w-full h-full hover:*:visible cursor-pointer grid place-items-center'>
      <div className='invisible text-lg'>Delete</div>
    </div>
  })
  if (!started) return <>
  <div className='h-dvh grid place-items-center cursor-pointer'>Click anywhere to start.</div>
  </>
  return (
    <div className='h-dvh flex flex-col gap-10 justify-center items-center'>
      <p> Demo app for headless <a className="cursor-pointer" href="https://dood.al/pinktrombone/">Pink Trombone</a>.</p>
      <div className="grid grid-cols-[repeat(auto-fit,100px)] self-stretch content-center justify-center  *:size-20 gap-4">
          {tromboneDivs}
          <div className='size-20 cursor-pointer text-lg grid place-items-center border-pink-300 border-2 hover:*:visible' onClick={createTrombone}>
            <div className='invisible text-lg'>New</div>
          </div>
      </div>
      <div ref={canvasContainerRef} className="pointer relative max-h-full aspect-square inset-0.5 -translate-0.5 hidden" />
    </div>
  )
}

export default App
