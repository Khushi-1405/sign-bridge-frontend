import React, { useState, useRef, useEffect, useCallback } from "react";
import socket from "../socket";

const Controls = ({ roomId, setSign }) => {
  const [sign, setLocalSign] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(false);

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

  // 📸 STEP 2: Capture Frame
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

  // 🤖 STEP 3: Send to FastAPI
  const detectSign = useCallback(async () => {
    try {
      const image = captureFrame();
      if (!image) return;

      setLoading(true);

      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      const data = await res.json();

      // 📺 STEP 4: Show prediction
      if (data.sign) {
        setLocalSign(data.sign);
        setSign(data.sign);

        // 📡 Send to other user
        socket.emit("send-sign", data.sign, roomId);
      }
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, setSign]);

  // 🔁 STEP 5: Auto Detection
  useEffect(() => {
    if (!autoDetect) return;

    const interval = setInterval(() => {
      detectSign();
    }, 1000);

    return () => clearInterval(interval);
  }, [autoDetect, detectSign]);

  return (
    <div style={{ textAlign: "center" }}>
      <h3>🤟 AI Sign Detection</h3>

      {/* 🎥 Camera with Overlay */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginBottom: "10px",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="260"
          style={{
            borderRadius: "12px",
            border: "2px solid #6366f1",
          }}
        />

        {/* ✨ SIGN OVERLAY */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {loading ? "⏳ Detecting..." : sign || "🤟 Show a sign"}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* 🤖 Controls */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={detectSign} disabled={loading}>
          {loading ? "Detecting..." : "Detect Sign 🤟"}
        </button>

        <button
          onClick={() => setAutoDetect(!autoDetect)}
          style={{
            marginLeft: "10px",
            background: autoDetect ? "#22c55e" : "#e5e7eb",
          }}
        >
          {autoDetect ? "Auto ON 🔁" : "Auto OFF"}
        </button>
      </div>

      {/* 📺 Extra Text Output */}
      <div
        style={{
          marginTop: "10px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#ec4899",
        }}
      >
        {loading ? "⏳ Detecting..." : `✨ Detected: ${sign || "Waiting..."}`}
      </div>
    </div>
  );
};

export default Controls;