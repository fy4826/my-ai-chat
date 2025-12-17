import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", chatRoutes);
app.listen(config.port, () => {
    console.log(`Backend running at http://localhost:${config.port}`);
    console.log(`Model: ${config.modelName}`);
});
