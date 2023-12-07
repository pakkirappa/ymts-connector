import { useEffect, useRef, useState } from "react";
import { Peer } from "peerjs";

const getRandomId = (length = 2) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

function App() {
  // const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const connectToPeer = async () => {
    if (!peer) {
      console.log("No peer on click");
      return;
    }
    const conn = peer.connect(peerId);

    conn.on("error", (err) => {
      console.log(err, "err");
    });

    conn.on("open", () => {
      conn.send("can we connect?");
    });

    if (!navigator.mediaDevices) {
      console.log("No media devices");
      return;
    }

    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const call = peer.call(peerId, videoStream);

    call.on("error", (err) => {
      console.log(err);
    });

    call.on("stream", async (remoteStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        await videoRef.current.play();
      }
    });

    call.on("willCloseOnRemote", () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });
  };

  const toggleVideo = () => {
    if (!peer) {
      console.log("No peer toggle video");
      return;
    }

    if (!navigator.mediaDevices) {
      console.log("No media devices");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: true,
      })
      .then((stream) => {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = !videoTracks[0].enabled;
        } else {
          console.log("No audio tracks");
        }
      });

    setIsVideoOn((prev) => !prev);
  };

  const toggleAudio = () => {
    if (!peer) {
      console.log("No peer toggle audio");
      return;
    }

    if (!navigator.mediaDevices) {
      console.log("No media devices");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = !audioTracks[0].enabled;
        } else {
          console.log("No audio tracks");
        }
      });

    setIsAudioOn((prev) => !prev);
  };

  const getPeers = async () => {
    const myPeer = new Peer(getRandomId()); // creating a peer (peer = user)
    setPeer(myPeer);

    if (!myPeer) {
      console.log("No peer get peers");
      return;
    }

    // when peer is initialized and ready to use
    myPeer.on("open", (id) => {
      console.log("My peer id is: " + id);
    });

    // when connected to another peer (another user) or when another peer connects to this peer
    myPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        console.log("data received", data);
      });
    });

    if (!myPeer) {
      console.log("No peer initally");
      return;
    }

    if (!navigator.mediaDevices) {
      console.log("No media devices");
      return;
    }

    // when got a call
    myPeer.on("call", async (call) => {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // asking the user if he wants to accept the call
      if (!window.confirm("Do you want to accept the call?")) {
        call.close(); // closing the call if user doesn't want to accept the call
        return;
      }

      // answering the call and sending the stream
      call.answer(videoStream);

      call.on("stream", (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play();
        }
      });
    });
  };

  // method for sharing screen with other peer
  const toggleShareScreen = async () => {
    if (!peer) {
      console.log("No peer toggle share screen");
      return;
    }

    if (!navigator.mediaDevices) {
      console.log("No media devices");
      return;
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    setIsVideoOn((prev) => !prev);
  };

  useEffect(() => {
    getPeers();
  }, []);

  return (
    <div className="flex justify-between h-screen">
      <div className="w-4/5 bg-white">
        <div className="flex justify-between h-full w-full flex-col">
          <video ref={videoRef} className="bg-yellow-500 w-full h-full" />
          <div className="flex justify-center flex-row w-full">
            <div className="flex justify-between h-16">
              <button
                onClick={toggleAudio}
                className="bg-blue-500 rounded-xl text-white font-sans text-2xl mx-2 px-10"
              >
                {isAudioOn ? "Mute" : "Unmute"}
              </button>
              <button
                onClick={toggleVideo}
                className="bg-blue-500 rounded-xl text-white font-sans text-2xl px-10"
              >
                {isVideoOn ? "Stop Video" : "Start Video"}
              </button>

              <button
                onClick={toggleShareScreen}
                className="bg-blue-500 rounded-xl text-white font-sans text-2xl px-10 mx-2"
              >
                {isVideoOn ? "Stop Screen Share" : "Start Screen Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-80 bg-red-500">
        <input
          type="text"
          className="w-full h-16"
          placeholder="Enter peer id"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          required
        />
        <button
          onClick={connectToPeer}
          className="bg-blue-500 rounded-xl text-white font-sans text-2xl px-10"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

export default App;
