import { useEffect, useState, useRef } from 'react';
import { PinkTrombone } from '@asmatzaile/pink-trombone';

function App() {
  const [started, setStarted] = useState(false);
  const audioContextRef = useRef();

  const [trombones, setTrombones] = useState(new Set());

  const createTrombone = () => {
    const trombone = new PinkTrombone(audioContextRef.current);
    trombone.isVoiced = true;
    trombone.pitch = Math.random() * (64-41) + 41; // between F2 and E4
    setTrombones(p => {
      const n = new Set(p);
      n.add(trombone);
      return n;
    });
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
    const controller = new AbortController();
    document.addEventListener("pointerdown", () => {
      audioContextRef.current = new window.AudioContext();
      setStarted(true);
      const trombone = createTrombone();
      window.trombone = trombone; // for debugging
    }, { once: true, signal: controller. signal });

    return () => controller.abort();
  }, [])
  
  if (!started) return <div className='h-dvh grid place-items-center cursor-pointer'>Click anywhere to start.</div>
  return (
    <div className={`h-dvh flex flex-col gap-10 justify-center items-center`}>
     <p>Demo app for headless <a href="https://dood.al/pinktrombone/">Pink Trombone</a>.</p>
     <div className="grid grid-cols-[repeat(auto-fit,100px)] self-stretch content-center justify-center  *:size-20 gap-4">
      {[...trombones].map(t=> <div onClick={() => deleteTrombone(t)}
        className=' bg-pink-300 hover:*:visible cursor-pointer grid place-items-center'>
        <div className='invisible text-lg'>Delete</div>
      </div>)}
      <div className='size-20 cursor-pointer text-lg grid place-items-center border-pink-300 border-2 hover:*:visible' onClick={createTrombone}>
        <div className='invisible text-lg'>New</div>
      </div>
      </div>
    </div>
  )
}

export default App
