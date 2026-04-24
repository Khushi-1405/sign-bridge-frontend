import React, { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";

const VideoCall = ({ roomId }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const canvasRef = useRef(null);
  const peerConnection = useRef(null);
  const lastSignRef = useRef("");
  const streamRef = useRef(null);

  // States
  const [sign, setSign] = useState("");
  const [remoteSign, setRemoteSign] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [localCaption, setLocalCaption] = useState("");
  const [remoteCaption, setRemoteCaption] = useState("");
  const [remoteGif, setRemoteGif] = useState(null);

  // 1. Unified Camera & WebRTC Initialization
  useEffect(() => {
    const initStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
        streamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );

        peerConnection.current.ontrack = (event) => {
          if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", event.candidate, roomId);
          }
        };
      } catch (err) {
        console.error("WebRTC Init Error:", err);
      }
    };

    initStream();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId]);

  // 2. Optimized Socket Listeners with Signaling State Checks
  useEffect(() => {
    socket.on("offer", async (offer) => {
      if (!peerConnection.current) return;

      // 🔥 FIX: Only process offer if stable to avoid collisions
      if (peerConnection.current.signalingState !== "stable") return;

      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", answer, roomId);
      } catch (err) {
        console.error("Offer Error:", err);
      }
    });

    socket.on("answer", async (answer) => {
      if (!peerConnection.current) return;

      // 🔥 FIX: Only process answer if we actually sent an offer
      if (peerConnection.current.signalingState !== "have-local-offer") return;

      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Answer Error:", err);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        if (peerConnection.current && candidate) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) { console.warn("ICE Candidate Error:", e); }
    });

    socket.on("receive-caption", (data) => setRemoteCaption(data.text));
    socket.on("receive-sign", (receivedSign) => setRemoteSign(receivedSign));
    socket.on("receive-speech-gif", (data) => {
      setRemoteGif(data.gifUrl);
      setTimeout(() => setRemoteGif(null), 3500);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("receive-caption");
      socket.off("receive-sign");
      socket.off("receive-speech-gif");
    };
  }, [roomId]);

  // 3. Browser-Based Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript.toLowerCase())
        .join("");
      
      setLocalCaption(transcript);
      socket.emit("send-caption", { text: transcript, roomId });

      const keywords = ["hello", "thanks", "yes", "no", "please", "sorry"];
      const found = keywords.find(word => transcript.split(" ").includes(word));
      
      if (found) {
        const gifUrl = `https://sign-bridge-backend.onrender.com/signs/${found}.gif`;
        socket.emit("send-speech-gif", { gifUrl, roomId });
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [roomId]);

  // 4. Drawing Logic
  const drawLandmarks = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    ctx.fillStyle = "#10b981";
    landmarks.forEach((point) => {
      const x = (1 - point.x) * canvas.width;
      const y = point.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, []);

  // 5. Render-Optimized Prediction Loop
  const sendFrameToBackend = useCallback(async () => {
    if (!localVideo.current || localVideo.current.readyState !== 4) return;
    
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = 320; 
    captureCanvas.height = 240;
    const ctx = captureCanvas.getContext("2d");
    ctx.drawImage(localVideo.current, 0, 0, 320, 240);
    
    const image = captureCanvas.toDataURL("image/jpeg", 0.3);

    try {
      const res = await fetch("https://sign-bridge-backend.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) throw new Error("Server sleeping");

      const data = await res.json();
      setIsAiConnected(true);
      drawLandmarks(data.landmarks);

      if (data.sign && data.sign !== lastSignRef.current) {
        if (data.confidence > 60 || data.sign === "No Sign") {
          setSign(data.sign);
          setConfidence(data.confidence || 0);
          lastSignRef.current = data.sign;
          socket.emit("send-sign", data.sign, roomId);
        }
      }
    } catch {
      setIsAiConnected(false);
    }
  }, [roomId, drawLandmarks]);

  useEffect(() => {
    const aiInterval = setInterval(sendFrameToBackend, 1500);
    return () => clearInterval(aiInterval);
  }, [sendFrameToBackend]);

  return (
    <div style={styles.container}>
      <div style={styles.videoGrid}>
        <div style={styles.videoWrapper}>
          <div style={{...styles.badge, background: isAiConnected ? "#10b981" : "#ef4444"}}>
            {isAiConnected ? "AI ACTIVE" : "AI OFFLINE (Waking Up...)"}
          </div>
          <video ref={localVideo} autoPlay muted playsInline style={styles.localVideo} />
          <canvas ref={canvasRef} style={styles.mlCanvas} />
          <div style={styles.captionOverlay}>{localCaption || "Listening..."}</div>
          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
               <span style={styles.signLabel}>{sign || "SCANNING"}</span>
               {confidence > 0 && sign !== "No Sign" && <span style={styles.confText}>{confidence.toFixed(0)}% Match</span>}
            </div>
          </div>
        </div>

        <div style={styles.videoWrapper}>
          <div style={styles.badgeRed}>REMOTE</div>
          <video ref={remoteVideo} autoPlay playsInline style={styles.remoteVideo} />
          {remoteGif && (
            <div style={styles.gifOverlay}>
              <img src={remoteGif} alt="sign-gif" style={styles.signGif} />
            </div>
          )}
          <div style={styles.captionOverlay}>{remoteCaption || "Waiting for captions..."}</div>
          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
              <span style={styles.signLabel}>{remoteSign || "NO SIGN DETECTED"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <button onClick={async () => {
          if (peerConnection.current.signalingState !== "stable") return;
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", offer, roomId);
        }} style={styles.callBtn}>
          Connect Call 💬
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "20px", background: "#0f172a", borderRadius: "20px", minHeight: "80vh" },
  videoGrid: { display: "flex", justifyContent: "center", gap: "25px", flexWrap: "wrap" },
  videoWrapper: { position: "relative", width: "350px", borderRadius: "24px", overflow: "hidden", background: "#1e293b", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" },
  localVideo: { width: "100%", height: "260px", objectFit: "cover", transform: "scaleX(-1)" },
  remoteVideo: { width: "100%", height: "260px", objectFit: "cover" },
  mlCanvas: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 },
  badge: { position: "absolute", top: "15px", left: "15px", zIndex: 10, color: "#fff", fontSize: "11px", padding: "5px 10px", borderRadius: "8px", fontWeight: "bold" },
  badgeRed: { position: "absolute", top: "15px", left: "15px", zIndex: 10, background: "#f43f5e", color: "#fff", fontSize: "11px", padding: "5px 10px", borderRadius: "8px", fontWeight: "bold" },
  captionOverlay: { position: "absolute", top: "45px", left: "50%", transform: "translateX(-50%)", width: "90%", background: "rgba(15, 23, 42, 0.8)", color: "white", padding: "8px", borderRadius: "10px", fontSize: "13px", textAlign: "center", zIndex: 20, border: "1px solid rgba(255,255,255,0.1)" },
  signOverlay: { position: "absolute", bottom: "15px", left: "50%", transform: "translateX(-50%)", width: "80%", zIndex: 10 },
  signInfo: { background: "rgba(15, 23, 42, 0.9)", padding: "10px", borderRadius: "15px", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.3)" },
  signLabel: { color: "#fff", fontWeight: "bold", fontSize: "16px" },
  confText: { color: "#10b981", fontSize: "12px", marginTop: "4px" },
  gifOverlay: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 30, background: "rgba(15, 23, 42, 0.8)", padding: "12px", borderRadius: "20px" },
  signGif: { width: "130px", height: "130px", borderRadius: "12px", border: "2px solid #6366f1" },
  controls: { display: "flex", justifyContent: "center", marginTop: "25px" },
  callBtn: { padding: "14px 28px", background: "#6366f1", color: "white", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", border: "none", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)" },
};

export default VideoCall;