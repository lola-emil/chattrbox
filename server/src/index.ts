import express from "express";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const PORT = parseInt(process.env["PORT"] ?? "5000");

const app = express();
const server = http.createServer(app);


server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));