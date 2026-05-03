import React, { useState, useRef, useEffect, useCallback } from "react";
import socket from "../socket";

const Controls = ({ roomId, setSign }) => {
  const [sign, setLocalSign] = useState("");
  const [remoteSign, setRemoteSign] = useState(""); // 📡 Added for the other user's signs
  const [aiStatus, setAiStatus] = useState("OFFLINE"); // 🤖 Added to track AI Engine status
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 🎥 STEP 1: Access Camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera error:", err));
  }, []);

  // 📡 STEP 2: Socket Listeners (The missing "Remote" bridge)
  useEffect(() => {
    socket.on("receive-sign", (incomingSign) => {
      setRemoteSign(incomingSign); // Updates the "Remote" box for you
    });

    return () => socket.off("receive-sign");
  }, []);

  // 🎙️ STEP 3: Speech API & Status Check
  useEffect(() => {
    // Check AI Engine Health on load
    fetch("https://glowing-capybara-x55x597jjx6gfvv7g-8000.app.github.dev/")
      .then(res => { if(res.ok) setAiStatus("ONLINE") })
      .catch(() => setAiStatus("OFFLINE"));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const text = event.results[event.resultIndex][0].transcript;
        setTranscript(text);
        socket.emit("send-sign", `[Voice]: ${text}`, roomId);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [roomId]);

  const toggleListening = () => {
    if (isListening) { recognitionRef.current.stop(); } 
    else { setIsListening(true); recognitionRef.current.start(); }
  };

  const captureFrame = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;
  if (!canvas || !video) return null;

  // Reduce size to improve speed!
  canvas.width = 224; 
  canvas.height = 224;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 224, 224);

  // Lower quality = faster transmission
  return canvas.toDataURL("image/jpeg", 0.5); 
};

  // 🤖 STEP 4: AI Inference
  const detectSign = useCallback(async () => {
    try {
      const image = captureFrame();
      if (!image) return;
      setLoading(true);

      const res = await fetch("https://glowing-capybara-x55x597jjx6gfvv7g-8000.app.github.dev/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();
      if (data.sign) {
        setLocalSign(data.sign);
        setSign(data.sign);
        socket.emit("send-sign", data.sign, roomId); // Send to remote user
        setAiStatus("ONLINE");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setAiStatus("OFFLINE");
    } finally {
      setLoading(false);
    }
  }, [roomId, setSign]);

  useEffect(() => {
    if (!autoDetect) return;
    const interval = setInterval(detectSign, 1000);
    return () => clearInterval(interval);
  }, [autoDetect, detectSign]);

  return (
    <div style={{ textAlign: "center", padding: "20px", background: "#0f172a", color: "white", borderRadius: "15px" }}>
      {/* AI Status Indicator */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", color: aiStatus === "ONLINE" ? "#22c55e" : "#ef4444" }}>
          ● AI ENGINE {aiStatus}
        </span>
      </div>

      <div style={{ position: "relative", display: "inline-block", marginBottom: "15px" }}>
        <video ref={videoRef} autoPlay playsInline width="320" style={{ borderRadius: "12px", border: "2px solid #6366f1" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", padding: "5px 15px", borderRadius: "20px" }}>
          {loading ? "⌛..." : sign || "🤟 Show Sign"}
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        <button onClick={detectSign} style={{ background: "#6366f1", color: "white", padding: "8px 15px", borderRadius: "8px" }}>Detect</button>
        <button onClick={() => setAutoDetect(!autoDetect)} style={{ background: autoDetect ? "#22c55e" : "#334155", color: "white", padding: "8px 15px", borderRadius: "8px" }}>
          {autoDetect ? "Auto ON" : "Auto OFF"}
        </button>
        <button onClick={toggleListening} style={{ background: isListening ? "#ef4444" : "#ec4899", color: "white", padding: "8px 15px", borderRadius: "8px" }}>
          {isListening ? "Stop Voice" : "Start Voice"}
        </button>
      </div>

      {/* Two-Way Translation Display */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>REMOTE SIGN</p>
          <p style={{ fontWeight: "bold" }}>{remoteSign || "Waiting..."}</p>
        </div>
        <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>VOICE TRANSCRIPT</p>
          <p style={{ fontWeight: "bold" }}>{transcript || "..."}</p>
        </div>
      </div>
    </div>
  );
};

export default Controls;