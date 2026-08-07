require("dotenv").config();
const express = require("express");
const bodyParser = require("express").json;
const cors = require("cors");
const connectDB = require("./shared/middlewares/connect-db");
const questionRoutes = require("./modules/questions/routes/questionRoutes");
const userRoutes = require("./modules/users/routes/userRoutes");
const categoryRoutes = require("./modules/categories/routes/categoryRoutes");
const aiRoutes = require("./modules/ai/routes/aiRoutes");
const notFound = require("./shared/middlewares/notFound");
const errorHandler = require("./shared/middlewares/errorHandler");
const logger = require("./shared/middlewares/logger");

const app = express();
const hostname = process.env.HOSTNAME || "127.0.0.1";
const port = process.env.PORT || 3001;

async function startServer() {
  try {
    // Global Middlewares
    app.use(bodyParser());
    app.use(logger);
    app.use(cors()); // enable CORS

    // API Routes with DB connection middleware
    app.use("/questions", connectDB, questionRoutes);
    app.use("/users", connectDB, userRoutes);
    app.use("/categories", connectDB, categoryRoutes);
    app.use("/ai", aiRoutes);

    // Error Handler Middleware
    app.use(notFound);
    app.use(errorHandler);

    // Start Server
    app.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB. Server not started.");
  }
}

startServer();
