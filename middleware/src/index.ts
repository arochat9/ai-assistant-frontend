import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import tasksRoutes from "./routes/tasks.routes";
import agentRoutes from "./routes/agent.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes (must come before static file serving)
app.use("/api/tasks", tasksRoutes);
app.use("/api/agent", agentRoutes);

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, "../../web-frontend/dist")));

// Handle client-side routing - send all other requests to React app
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../web-frontend/dist/index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Middleware server is running on port ${PORT}`);
});
