import React, { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";

const VideoCall = ({ roomId }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const canvasRef = useRef(null);
  const peerConnection = useRef(null);
  const lastSignRef = useRef("");

  // States
  const [sign, setSign] = useState("");
  const [remoteSign, setRemoteSign] = useState(""); // 🔥 State for receiving signs
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [caption, setCaption] = useState("");

  // 🎤 SPEECH RECOGNITION & BROADCASTING
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setCaption(transcript);
      socket.emit("send-caption", { text: transcript, roomId });
    };

    recognition.start();

    // 📡 RECEIVE BROADCASTS
    socket.on("receive-caption", (data) => {
      setCaption(data.text);
    });

    socket.on("receive-sign", (receivedSign) => {
      setRemoteSign(receivedSign); // 🔥 Update UI with remote user's sign
    });

    return () => {
      recognition.stop();
      socket.off("receive-caption");
      socket.off("receive-sign");
    };
  }, [roomId]);

  // 🖌️ Drawing Engine for Hand Tracking
  const drawLandmarks = useCallback((landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (
        canvas.width !== canvas.clientWidth ||
        canvas.height !== canvas.clientHeight
      ) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks || landmarks.length === 0) return;

      ctx.fillStyle = "#10b981";
      landmarks.forEach((point) => {
        const x = (1 - point.x) * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, []);

  // 📸 Frame Capture Logic
  const captureFrame = useCallback(() => {
    if (!localVideo.current || localVideo.current.readyState !== 4) return null;
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = 400;
    captureCanvas.height = 300;
    const ctx = captureCanvas.getContext("2d");
    ctx.drawImage(
      localVideo.current,
      0,
      0,
      captureCanvas.width,
      captureCanvas.height,
    );
    return captureCanvas.toDataURL("image/jpeg", 0.6);
  }, []);

  // 🤖 AI Prediction Loop
  const sendFrameToBackend = useCallback(async () => {
    if (!localVideo.current || !localVideo.current.videoWidth) return;
    const image = captureFrame();
    if (!image) return;

    setLoading(true);
    try {
      const res = await fetch(
        "https://sign-bridge-backend.onrender.com/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        },
      );

      const data = await res.json();
      setIsAiConnected(true);
      drawLandmarks(data.landmarks || []);

      if (data.sign && data.sign !== lastSignRef.current) {
        if (data.confidence > 65 || data.sign === "No Sign") {
          setSign(data.sign);
          setConfidence(data.confidence || 0);
          lastSignRef.current = data.sign;
          // 🔥 BROADCAST SIGN TO ROOM
          socket.emit("send-sign", data.sign, roomId);
        }
      }
    } catch (aiError) {
      console.error("AI connection failed:", aiError);
      setIsAiConnected(false);
    } finally {
      setLoading(false);
    }
  }, [roomId, captureFrame, drawLandmarks]);

  useEffect(() => {
    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
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
          if (event.candidate)
            socket.emit("ice-candidate", event.candidate, roomId);
        };

        socket.on("offer", async (offer) => {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(offer),
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", answer, roomId);
        });

        socket.on("answer", async (answer) => {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        });

        socket.on("ice-candidate", async (candidate) => {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (e) {
            console.error("ICE Error:", e);
          }
        });
      } catch (err) {
        console.error("WebRTC Error:", err);
      }
    };

    initWebRTC();
    const aiInterval = setInterval(sendFrameToBackend, 900);
    return () => {
      clearInterval(aiInterval);
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomId, sendFrameToBackend]);

  return (
    <div style={styles.container}>
      <div style={styles.videoGrid}>
        {/* LOCAL USER */}
        <div style={styles.videoWrapper}>
          <div
            style={{
              ...styles.badge,
              background: isAiConnected ? "#10b981" : "#ef4444",
            }}
          >
            {isAiConnected ? "AI ACTIVE" : "AI OFFLINE"}
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
            {caption || "Waiting for speech..."}
          </div>

          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
              <span style={styles.signLabel}>
                {loading ? "⌛..." : sign || "SCANNING"}
              </span>
              {confidence > 0 && sign !== "No Sign" && (
                <span style={styles.confText}>
                  {confidence.toFixed(1)}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        {/* REMOTE USER */}
        <div style={styles.videoWrapper}>
          <div style={styles.badgeRed}>REMOTE</div>
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            style={styles.remoteVideo}
          />
          <div style={styles.captionOverlay}>{caption}</div>
          
          {/* 🔥 REMOTE SIGN DISPLAY */}
          <div style={styles.signOverlay}>
            <div style={styles.signInfo}>
              <span style={styles.signLabel}>
                {remoteSign || "NO SIGN DETECTED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", offer, roomId);
        }}
        style={styles.callBtn}
      >
        Connect Call 💬
      </button>
    </div>
  );
};

const styles = {
  container: { padding: "20px", background: "#0f172a", borderRadius: "20px" },
  videoGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "25px",
    flexWrap: "wrap",
  },
  videoWrapper: {
    position: "relative",
    width: "350px",
    borderRadius: "24px",
    overflow: "hidden",
    background: "#1e293b",
  },
  localVideo: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },
  remoteVideo: { width: "100%", height: "260px", objectFit: "cover" },
  mlCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 5,
  },
  badge: {
    position: "absolute",
    top: "15px",
    left: "15px",
    zIndex: 10,
    color: "#fff",
    fontSize: "11px",
    padding: "5px 10px",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  badgeRed: {
    position: "absolute",
    top: "15px",
    left: "15px",
    zIndex: 10,
    background: "#f43f5e",
    color: "#fff",
    fontSize: "11px",
    padding: "5px 10px",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  captionOverlay: {
    position: "absolute",
    top: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "8px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "center",
    zIndex: 20,
  },
  signOverlay: {
    position: "absolute",
    bottom: "15px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    zIndex: 10,
  },
  signInfo: {
    background: "rgba(15, 23, 42, 0.9)",
    padding: "10px",
    borderRadius: "15px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
  },
  signLabel: { color: "#fff", fontWeight: "bold", fontSize: "16px" },
  confText: { color: "#10b981", fontSize: "12px", marginTop: "4px" },
  callBtn: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "#6366f1",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
  },
};

export default VideoCall;