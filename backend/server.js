const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());
dotenv.config();
connectDB();

app.get("/", (req, res) => {
  res.send("API is working");
});
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5008;
app.listen(PORT, console.log(`Server running at ${PORT}`));
