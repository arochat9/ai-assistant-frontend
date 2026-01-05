import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import tasksRoutes from "./routes/tasks.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Middleware server is running" });
});

app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/tasks", tasksRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Middleware server is running on port ${PORT}`);
});
