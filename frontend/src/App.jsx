import React, { useState, useEffect } from "react";
import "./App.css";
import Editor from "@monaco-editor/react";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Start Code Here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [theme, setTheme] = useState("vs-dark"); // Add state for theme

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}.... is typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
      toast.success(`Joined room ${roomId} as ${userName}!`, {
        position: "top-right",
      });
    } else {
      toast.error("Please provide both Room ID and Username!", {
        position: "top-right",
      });
    }
  };

  const leaveRoom = () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave the room?"
    );
    if (confirmLeave) {
      socket.emit("leaveRoom");
      setJoined(false);
      setRoomId("");
      setUserName("");
      setCode("// Start Code Here");
      setLanguage("javascript");
      toast.info("You have left the room.", {
        position: "top-right",
      });
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    toast.success("Room ID copied to clipboard!", {
      position: "top-right",
    });
    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleCodeChange = (newCode) => {
    if (newCode !== code) {
      setCode(newCode);
      socket.emit("codeChange", { roomId, code: newCode });
      socket.emit("typing", { roomId, userName });
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value); // Update the theme state
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") joinRoom(); // Trigger joinRoom on Enter
            }}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") joinRoom(); // Trigger joinRoom on Enter
            }}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
        <ToastContainer />
      </div>
    );
  }if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") joinRoom(); // Trigger joinRoom on Enter
            }}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") joinRoom(); // Trigger joinRoom on Enter
            }}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId}>Copy ID</button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index} title={user}>
              {user.length > 10 ? `${user.slice(0, 8)}...` : user}
            </li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <select
          className="theme-selector"
          value={theme}
          onChange={handleThemeChange}
        >
          <option value="vs-dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme={theme} // Apply the selected theme
          options={{
            minimap: { enabled: false },
            fontSize: 26,
          }}
        />
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
