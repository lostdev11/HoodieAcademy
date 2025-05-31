const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Public waiting area chat
io.of("/public").on("connection", (socket) => {
  console.log("Public user connected:", socket.id);
  socket.on("send_message", (data) => {
    io.of("/public").emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log("Public user disconnected:", socket.id);
  });
});

// Secret chat room
io.of("/secret").on("connection", (socket) => {
  console.log("Secret user connected:", socket.id);
  socket.on("send_message", (data) => {
    io.of("/secret").emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log("Secret user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});