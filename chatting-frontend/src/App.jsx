import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import "./style.css";

let socket;

function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [chats, setChats] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    socket = io("http://192.168.1.5:3000", { 
    });

    socket.on("user-list", (list) => {
      console.log("Received user list:", list);
      const me = socket.id;
      setUsers(list.filter((u) => u.username !== username));
    });

    socket.on("receive-message", (data) => {
      const { from } = data;
      const user = users.find((u) => u.username === from);
      const key = user?.socketId;
      if (!key) return;

      setChats((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), data],
      }));
    });

    socket.on("typing", (data) => {
      if (data.from === selectedUser?.username) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isLoggedIn, username, users, selectedUser]);

  const sendMessage = () => {
    if (!message || !selectedUser) return;

    const msgData = {
      to: selectedUser.socketId,
      from: username,
      message,
    };

    socket.emit("private-message", msgData);

    const newMessage = {
      from: username,
      message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChats((prev) => ({
      ...prev,
      [selectedUser.socketId]: [...(prev[selectedUser.socketId] || []), newMessage],
    }));

    setMessage("");
    setShowEmojiPicker(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <h2>Enter your name</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name"
        />
        <button onClick={() => username.trim() && setIsLoggedIn(true)}>Login</button>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className="sidebar">
        <h3>Users</h3>
        <ul>
          {users.map((u) => (
            <li
              key={u.socketId}
              onClick={() => setSelectedUser(u)}
              className={selectedUser?.socketId === u.socketId ? "active" : ""}
            >
              {u.username}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-section">
        <h3>Chat with: {selectedUser?.username || "..."}</h3>

        {typing && selectedUser && (
          <div style={{ margin: "5px 10px", color: "#666", fontStyle: "italic" }}>
            {selectedUser.username} is typing...
          </div>
        )}

        <div className="chat-box">
          {(chats[selectedUser?.socketId] || []).map((msg, i) => (
            <div
              key={i}
              className={msg.from === username ? "message you" : "message other"}
            >
              <strong>{msg.from}:</strong> {msg.message}
              <div className="time">{msg.time}</div>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div style={{ position: "relative" }}>
            <div className="chat-input">
              <button
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="emoji-toggle"
              >
                😊
              </button>
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  socket.emit("typing", {
                    to: selectedUser.socketId,
                    from: username,
                  });
                }}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>

            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  onEmojiClick={(emojiData) =>
                    setMessage((prev) => prev + emojiData.emoji)
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
