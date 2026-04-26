import React, { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";

// 🌍 CONFIGURATION
const AI_BACKEND_URL = "https://sign-bridge-backend.onrender.com";

const VideoCall = ({ roomId }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const canvasRef = useRef(null);
  const peerConnection = useRef(null);
  const lastSignRef = useRef("");
  const streamRef = useRef(null);
  const iceQueue = useRef([]);
  const isLooping = useRef(false);

  // States
  const [sign, setSign] = useState("");
  const [remoteSign, setRemoteSign] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [localCaption, setLocalCaption] = useState("");
  const [remoteCaption, setRemoteCaption] = useState("");

  // 1. Initialize Camera & WebRTC
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

        stream
          .getTracks()
          .forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.ontrack = (event) => {
          if (remoteVideo.current)
            remoteVideo.current.srcObject = event.streams[0];
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", event.candidate, roomId);
          }
        };
      } catch (error) {
        console.error("WebRTC Init Error:", error); // Fixed: Use the error variable
      }
    };

    initStream();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (peerConnection.current) peerConnection.current.close();
    };
  }, [roomId]);

  // 2. Signaling Logic
  useEffect(() => {
    const processQueuedCandidates = async () => {
      while (iceQueue.current.length > 0) {
        const candidate = iceQueue.current.shift();
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (e) {
          console.warn("Queued ICE Error:", e);
        }
      }
    };

    socket.on("offer", async (offer) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", answer, roomId);
        await processQueuedCandidates();
      } catch (e) {
        console.error("Offer Error:", e);
      }
    });

    socket.on("answer", async (answer) => {
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        await processQueuedCandidates();
      } catch (e) {
        console.error("Answer Error:", e);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      if (peerConnection.current?.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (e) {
          console.warn("ICE Error:", e);
        }
      } else {
        iceQueue.current.push(candidate);
      }
    });

    socket.on("receive-caption", (data) => setRemoteCaption(data.text));
    socket.on("receive-sign", (receivedSign) => setRemoteSign(receivedSign));

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("receive-caption");
      socket.off("receive-sign");
    };
  }, [roomId]);

  // 3. Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript.toLowerCase())
        .join("");
      setLocalCaption(transcript);
      socket.emit("send-caption", { text: transcript, roomId });
    };
    recognition.start();
    return () => recognition.stop();
  }, [roomId]);

  // 4. Drawing Landmarks
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

  // 5. Adaptive Prediction Loop
  const runPredictionLoop = useCallback(async () => {
    if (isLooping.current) return;
    isLooping.current = true;

    const processFrame = async () => {
      if (!localVideo.current || localVideo.current.readyState !== 4) {
        setTimeout(processFrame, 1000);
        return;
      }

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = 320;
      captureCanvas.height = 240;
      const ctx = captureCanvas.getContext("2d");
      ctx.drawImage(localVideo.current, 0, 0, 320, 240);
      const image = captureCanvas.toDataURL("image/jpeg", 0.4);

      try {
        const res = await fetch(`${AI_BACKEND_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });

        if (res.ok) {
          const data = await res.json();
          setIsAiConnected(true);
          drawLandmarks(data.landmarks);
          if (data.sign && data.sign !== lastSignRef.current) {
            setSign(data.sign);
            setConfidence(data.confidence || 0);
            lastSignRef.current = data.sign;
            socket.emit("send-sign", data.sign, roomId);
          }
          setTimeout(processFrame, 800);
        } else {
          throw new Error();
        }
      } catch (e) {
        console.error("AI Prediction Error:", e); // This uses 'e' and clears the warning
        setIsAiConnected(false);
        setTimeout(processFrame, 3000);
      }
    };

    processFrame();
  }, [roomId, drawLandmarks]);

  useEffect(() => {
    runPredictionLoop();
  }, [runPredictionLoop]);

  return (
    <div style={styles.container}>
      <div style={styles.videoGrid}>
        <div style={styles.videoWrapper}>
          <div
            style={{
              ...styles.badge,
              background: isAiConnected ? "#10b981" : "#f59e0b",
            }}
          >
            {isAiConnected ? "AI ACTIVE" : "AI WAKING UP..."}
          </div>
          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            style={styles.localVideo}
          />
          <canvas ref={canvasRef} style={styles.mlCanvas} />
          <div style={styles.captionOverlay}>
            {localCaption || "Listening..."}
          </div>
          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
              <span style={styles.signLabel}>{sign || "SCANNING"}</span>
              {confidence > 0 && (
                <span style={styles.confText}>
                  {confidence.toFixed(0)}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.videoWrapper}>
          <div style={styles.badgeRed}>REMOTE</div>
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            style={styles.remoteVideo}
          />
          <div style={styles.captionOverlay}>
            {remoteCaption || "Waiting for captions..."}
          </div>
          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
              <span style={styles.signLabel}>
                {remoteSign || "NO SIGN DETECTED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={async () => {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit("offer", offer, roomId);
          }}
          style={styles.callBtn}
        >
          Connect Stream 💬
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    background: "#0f172a",
    borderRadius: "32px",
    minHeight: "80vh",
  },
  videoGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "25px",
    flexWrap: "wrap",
  },
  videoWrapper: {
    position: "relative",
    width: "380px",
    borderRadius: "28px",
    overflow: "hidden",
    background: "#1e293b",
  },
  localVideo: {
    width: "100%",
    height: "280px",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  remoteVideo: { width: "100%", height: "280px", objectFit: "cover" },
  mlCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  badge: {
    position: "absolute",
    top: "15px",
    left: "15px",
    zIndex: 10,
    color: "#fff",
    fontSize: "10px",
    padding: "6px 12px",
    borderRadius: "10px",
    fontWeight: "bold",
  },
  badgeRed: {
    position: "absolute",
    top: "15px",
    left: "15px",
    zIndex: 10,
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    padding: "6px 12px",
    borderRadius: "10px",
    fontWeight: "bold",
  },
  captionOverlay: {
    position: "absolute",
    top: "50px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "85%",
    background: "rgba(15, 23, 42, 0.85)",
    color: "white",
    padding: "10px",
    borderRadius: "14px",
    fontSize: "13px",
    textAlign: "center",
    zIndex: 20,
  },
  signOverlay: {
    position: "absolute",
    bottom: "15px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "85%",
    zIndex: 10,
  },
  signInfo: {
    background: "rgba(15, 23, 42, 0.9)",
    padding: "12px",
    borderRadius: "18px",
    textAlign: "center",
  },
  signLabel: { color: "#fff", fontWeight: "800", fontSize: "18px" },
  confText: { color: "#10b981", fontSize: "11px" },
  controls: { display: "flex", justifyContent: "center", marginTop: "30px" },
  callBtn: {
    padding: "16px 32px",
    background: "#6366f1",
    color: "white",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
  },
};

export default VideoCall;
