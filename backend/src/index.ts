import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import notificationRoutes from "./routes/notifications";
import aiRoutes from "./routes/ai";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ 
    origin: "http://localhost:5173", 
    credentials: true 
}));

app.use(express.json());

app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});