import React, { useEffect, useState } from "react";
import socket from "../socket";

const SignDisplay = ({ sign, roomId }) => {
  // 🔥 STATES (FIXED ERROR HERE)
  const [mySign, setMySign] = useState("");
  const [remoteSign, setRemoteSign] = useState("");

  const [transcript, setTranscript] = useState("");
  const [remoteText, setRemoteText] = useState("");

  // 🎯 SIGN GIF DICTIONARY
  const signGIFs = {
    hello: "/gifs/hello.gif",
    thankyou: "/gifs/thankyou.gif",
    yes: "/gifs/yes.gif",
    no: "/gifs/no.gif",
  };

  // 🔁 TEXT → GIF
  const getGIF = (text) => {
    if (!text) return null;
    const key = text.toLowerCase().replace(/\s/g, "");
    return signGIFs[key] || null;
  };

  // 🤟 UPDATE MY SIGN + SEND
  useEffect(() => {
    if (sign) {
      setMySign(sign);
      socket.emit("send-sign", sign, roomId);
    }
  }, [sign, roomId]);

  // 📡 RECEIVE PARTNER SIGN
  useEffect(() => {
    socket.on("receive-sign", (data) => {
      setRemoteSign(data);
    });

    return () => socket.off("receive-sign");
  }, []);

  // 🎤 SPEECH TO TEXT
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      setTranscript(text);

      // 📡 SEND TEXT TO PARTNER
      socket.emit("send-text", text, roomId);
    };

    recognition.start();

    return () => recognition.stop();
  }, [roomId]);

  // 📡 RECEIVE PARTNER TEXT
  useEffect(() => {
    socket.on("receive-text", (text) => {
      setRemoteText(text);
    });

    return () => socket.off("receive-text");
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h2>🤟 Sign Bridge Live</h2>

      {/* 🔥 SIGN DISPLAY */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          marginTop: "20px",
        }}
      >
        <div>
          <h4>🧑 You</h4>
          <div style={{ fontSize: "40px", color: "#ec4899" }}>
            {mySign || "🤍 Waiting..."}
          </div>
        </div>

        <div>
          <h4>👤 Partner</h4>
          <div style={{ fontSize: "40px", color: "#3b82f6" }}>
            {remoteSign || "🤍 Waiting..."}
          </div>
        </div>
      </div>

      {/* 🎤 SPEECH DISPLAY */}
      <div style={{ marginTop: "30px" }}>
        <h4>🎤 You said:</h4>
        <p>{transcript || "Listening..."}</p>

        <h4>👤 Partner said:</h4>
        <p>{remoteText || "Waiting..."}</p>
      </div>

      {/* 🤟 SIGN GIF */}
      {getGIF(remoteText) && (
        <div style={{ marginTop: "20px" }}>
          <h4>🤟 Sign Translation</h4>
          <img
            src={getGIF(remoteText)}
            alt="sign"
            width="150"
            style={{ borderRadius: "10px" }}
          />
        </div>
      )}
    </div>
  );
};

export default SignDisplay;