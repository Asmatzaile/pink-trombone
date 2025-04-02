import { useEffect, useState, useRef } from 'react';
import { PinkTrombone } from '@asmatzaile/pink-trombone';
import { TromboneParams } from './TromboneParams';

function App() {
  const [started, setStarted] = useState(false);
  const audioContextRef = useRef();

  const [trombones, setTrombones] = useState(new Set());
  const [paramTrombone, setParamTrombone] = useState();

  const updateParamTrombone = (newTrombone) => {
    if (paramTrombone === newTrombone) setParamTrombone(undefined);
    else setParamTrombone(newTrombone);
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
    updateParamTrombone(undefined);
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
  
  const tromboneDivs = [...trombones].map(t=> {
    const isOpen = paramTrombone === t;
    return <div className="flex flex-col items-center relative">
      <div onClick={() => updateParamTrombone(t)}
      className=' bg-pink-300 w-full h-full hover:*:visible cursor-pointer grid place-items-center'>
        <div className='invisible text-lg'>Options</div>
      </div>
      { isOpen && <div className="w-1/2 bg-pink-300 rounded-full h-2 absolute -bottom-4"/>}
    </div>
  })
  if (!started) return <div className='h-dvh grid place-items-center cursor-pointer'>Click anywhere to start.</div>
  return (
    <div className={`h-dvh flex flex-col gap-10 justify-center items-center`}>
      <p>Demo app for headless <a href="https://dood.al/pinktrombone/">Pink Trombone</a>.</p>
      <div className="grid grid-cols-[repeat(auto-fit,100px)] self-stretch content-center justify-center  *:size-20 gap-4">
          {tromboneDivs}
          <div className='size-20 cursor-pointer text-lg grid place-items-center border-pink-300 border-2 hover:*:visible' onClick={createTrombone}>
            <div className='invisible text-lg'>New</div>
          </div>
      </div>
      { paramTrombone && <TromboneParams trombone={paramTrombone} />}
    </div>
  )
}

export default App
