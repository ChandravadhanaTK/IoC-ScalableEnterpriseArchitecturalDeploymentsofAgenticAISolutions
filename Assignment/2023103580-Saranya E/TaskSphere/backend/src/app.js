import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger.js";

import {
  apiLimiter,
} from "./middleware/rateLimit.middleware.js";


const app = express();

// Middleware
app.use(cors());

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API Running",
  });
});

// Auth Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);


app.use(errorHandler);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.use(apiLimiter);

export default app;