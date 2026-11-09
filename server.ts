import express from "express";
import path from "path";
import dotenv from "dotenv";
import { apiRouter } from "./server/routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API routes
app.use("/api", apiRouter);

// Serve static assets in production
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ClassFlip server running at http://0.0.0.0:${PORT}`);
});

export default app;
