import { useState } from 'react';
import { AudioSystem, Glottis } from '@asmatzaile/pink-trombone';

document.addEventListener("pointerdown", () => {
  const audioContext = new window.AudioContext();
  AudioSystem.init(audioContext);
  Glottis.isTouched = true;
}, { once: true });

function App() {
  const [started, setStarted] = useState(false);
  document.addEventListener("pointerdown", ()=>setStarted(true), { once: true });
  return (
    <div className={`h-dvh flex flex-col justify-center items-center ${!started ? "cursor-pointer" : ""}`}>
     <p>Demo app for headless <a href="https://dood.al/pinktrombone/">Pink Trombone</a>.</p>
     {! started && <p>Click anywhere to start.</p>}
    </div>
  )
}

export default App
