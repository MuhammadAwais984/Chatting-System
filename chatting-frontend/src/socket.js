import { io } from "socket.io-client";

const username = localStorage.getItem("chat-username");

const socket = io("http://192.168.1.8:3000", {
  transports: ["websocket"],
  query: {
    username: username || "unknown",
  },
});

export default socket;
