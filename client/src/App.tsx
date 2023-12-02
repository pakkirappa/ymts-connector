import { useEffect, useRef, useState } from "react";

function App() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const doSetUp = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    setStream(stream);
    // show continuous video
    // flip the video horizontally

    if (videoRef.current) {
      videoRef.current.srcObject = displayStream;
      videoRef.current.play();
      // videoRef.current.style.transform = "rotateY(180deg)";
    }
    displayStream.getTracks().forEach((track) => {
      track.onended = () => {
        setStream(null);
      };
    });
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  return (
    <div className="flex bg-red justify-around">
      <button onClick={doSetUp}>Start</button>
      <video
        ref={videoRef}
        autoPlay // this is the video stream
      />
      <button
        onClick={stopStream}
        className="bg-red-500 text-white p-3 rounded-m"
      >
        Stop{" "}
      </button>
    </div>
  );
}

export default App;
