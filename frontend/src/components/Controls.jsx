import React, { useState, useRef, useEffect, useCallback } from "react";
import socket from "../socket";

const Controls = ({ roomId, setSign }) => {
  const [sign, setLocalSign] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);
  
  // 🎙️ Speech State
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
      });
  }, []);

  // 🎙️ STEP 2: Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        
        // 📡 Emit voice text to the room so the other user sees it
        socket.emit("send-sign", `[Voice]: ${text}`, roomId);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [roomId]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // 📸 STEP 3: Capture Frame
  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  // 🤖 STEP 4: Send to FastAPI (Sign Language Detection)
  const detectSign = useCallback(async () => {
    try {
      const image = captureFrame();
      if (!image) return;

      setLoading(true);
      // Note: In production, change 'localhost' to your Vercel/Python backend URL
      const res = await fetch("https://glowing-capybara-x55x597jjx6gfvv7g-8000.app.github.dev/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` // Including your Auth token
        },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();

      if (data.sign) {
        setLocalSign(data.sign);
        setSign(data.sign);
        socket.emit("send-sign", data.sign, roomId);
      }
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, setSign]);

  // 🔁 STEP 5: Auto Detection Loop
  useEffect(() => {
    if (!autoDetect) return;
    const interval = setInterval(() => {
      detectSign();
    }, 1000);
    return () => clearInterval(interval);
  }, [autoDetect, detectSign]);

  return (
    <div style={{ textAlign: "center", padding: "20px", background: "#f8fafc", borderRadius: "15px" }}>
      <h3 style={{ color: "#4f46e5" }}>🤟 Sign Bridge AI</h3>

      <div style={{ position: "relative", display: "inline-block", marginBottom: "15px" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="320"
          style={{ borderRadius: "12px", border: "4px solid #6366f1", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        />

        <div style={{
            position: "absolute",
            bottom: "15px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            whiteSpace: "nowrap"
          }}>
          {loading ? "⏳ Analyzing..." : sign || "🤟 Show a sign"}
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "15px" }}>
        {/* Detection Controls */}
        <button 
          onClick={detectSign} 
          disabled={loading}
          style={{ padding: "10px 20px", borderRadius: "8px", cursor: "pointer", border: "none", background: "#6366f1", color: "white" }}
        >
          Detect Sign
        </button>

        <button
          onClick={() => setAutoDetect(!autoDetect)}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            border: "none",
            background: autoDetect ? "#22c55e" : "#cbd5e1",
            color: autoDetect ? "white" : "black",
          }}
        >
          {autoDetect ? "Auto ON 🔁" : "Auto OFF"}
        </button>

        {/* 🎙️ Voice Control */}
        <button
          onClick={toggleListening}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            border: "none",
            background: isListening ? "#ef4444" : "#ec4899",
            color: "white",
          }}
        >
          {isListening ? "Stop Voice 🎙️" : "Start Voice 🎤"}
        </button>
      </div>

      {/* Output Display */}
      <div style={{ background: "white", padding: "15px", borderRadius: "10px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}>
        <p style={{ margin: "5px 0", color: "#64748b" }}>
          <strong>Voice Transcript:</strong> {transcript || "No speech detected"}
        </p>
        <p style={{ margin: "5px 0", fontSize: "20px", color: "#4f46e5", fontWeight: "bold" }}>
          ✨ Detected Sign: {sign || "Waiting..." }
        </p>
      </div>
    </div>
  );
};

export default Controls;