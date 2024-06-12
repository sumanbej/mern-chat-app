const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const cors = require("cors");
const http = require("http"); // Import http for server creation
const { Server } = require("socket.io");
const app = express();
app.use(cors()); // Enable CORS for cross-origin requests

app.use(express.json());
dotenv.config();
connectDB();

// app.get("/", (req, res) => {  // Optional: uncomment for a simple API test
//   res.send("API is working");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000; // Set default port if not defined

const server = http.createServer(app); // Create server using http

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow CORS from your frontend
    credentials: true, // Enable cookies for authentication (if needed)
  },
  pingTimeout: 60000, // Set ping timeout for socket connections
});

io.on("connection", (socket) => {
  console.log("Connected to Socket.IO");

  // Handle user setup and room joining
  socket.on("setup", (userData) => {
    socket.join(userData._id); // Join user's room
    socket.emit("connected");
  });

  // Handle chat room joining
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  // Handle typing notifications
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // Handle new messages and broadcasting
  // socket.on("new message", (newMessageRecieved) => {
  //   const chat = newMessageRecieved.chat;

  //   if (!chat.users) {
  //     console.error("chat.users is not defined");
  //     return;
  //   }

  //   chat.users.forEach((user) => {
  //     if (user._id === newMessageRecieved.sender._id) return; // Skip sender
  //     socket.in(user._id).emit("message received", newMessageRecieved);
  //     console.log("socket message working");
  //   });
  // });
  socket.on("new message", async (newMessageRecieved) => {
    try {
      const chat = newMessageRecieved.chat;

      if (!chat.users) {
        console.error("chat.users is not defined");
        console.log(`chat is ${chat}`);
        return;
      }

      // Potentially asynchronous operation (replace with actual logic)
      const users = await getUsersInChat(chat._id); // Assuming this fetches user data

      users.forEach((user) => {
        if (user._id === newMessageRecieved.sender._id) return; // Skip sender
        socket.in(user._id).emit("message received", newMessageRecieved);
        console.log("socket message working");
      });
    } catch (error) {
      console.error("Error processing new message:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // Implement logic to remove user from rooms if needed
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
