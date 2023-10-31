/**
 * Index file for the server application for ymts-connector
 * @dev Written by WEB DEV TEAM - YMTS INDIA
 * @date 31st October 2023
 * @version 1.0.0
 */

import express from "express"; // express
import errorHandler from "./middleware/ErrorHandler"; //error handler
import morgan from "morgan"; // logger
import fs from "fs"; // file system
import cors from "cors"; // cors
import path from "path"; // path
import CONFIG from "./config"; //config file

import {
  itemsPerPageHandler,
  minChangeHandler,
  sortHandler,
} from "./middleware/Pagination";

import { memberAuthHandler } from "./middleware/AuthHandler";
import { FOLDER_NAMES } from "./constants";
import cookieParser from "cookie-parser";
import Config from "./config";
import mongoose from "mongoose";

import UserRouter from "./controllers/UserController";
import TopicRouter from "./controllers/TopicController";
import MessageRouter from "./controllers/MessageController";
import MeetingRouter from "./controllers/MeetingController";

const publicFolder = path.join(__dirname, FOLDER_NAMES.PUBLIC);

const foldersToCreate: string[] = [FOLDER_NAMES.ATTACHMENTS];

const app = express(); // create a new express app

// Middleware for CORS
const corsConfig = {
  origin: CONFIG.APP.CLIENT_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"],
};
// app.use(cors(corsConfig));
app.use(cors());

// other middleware
app.use(cookieParser()); // cookie parser middleware
app.use(express.json()); // json parser middleware
app.use(morgan("dev")); //logging middleware
app.use(`/${FOLDER_NAMES.STATIC_PATH}`, express.static(publicFolder)); //static files serving middleware

//initialize the database
async function startServer() {
  try {
    // checking if the public folder exists
    if (!fs.existsSync(publicFolder)) {
      fs.mkdirSync(publicFolder);
    }

    // looping over the folder names to create if there are none
    for (const name of foldersToCreate) {
      if (fs.existsSync(path.join(publicFolder, name))) {
        continue; //if the folder exists , we skip the iteration
      }
      fs.mkdirSync(path.join(publicFolder, name)); //creating the folders if there are any
    }

    // connecting to database
    await mongoose.connect(Config.DB.URL);
    console.log(`Database connected at ${Config.DB.URL}`);

    //start the server only after the database is initialized
    app.listen(Config.APP.PORT, () => {
      console.log(`Server is running on port ${Config.APP.PORT}`);
    });
  } catch (err: any) {
    console.log("Error: ", err.message);
    console.log(err);
  }
}

startServer(); // starting the server

// Index route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    health: "Good",
    msg: "Welcome to the API of YMTS Connector",
  });
});

app.use(minChangeHandler); // min handler middleware
app.use(itemsPerPageHandler); // items per page middleware
app.use(sortHandler); // sort handler middleware
app.use(memberAuthHandler); // member auth handler middleware

app.use("/api/users", UserRouter);
app.use("/api/topics", TopicRouter);
app.use("/api/messages", MessageRouter);
app.use("/api/meetings", MeetingRouter);

// 404 - Not Found route
app.use("*", (req, res) => {
  res.status(404).json({
    msg: "Please check the route you are trying to access",
  });
});

// Error handler middleware
app.use(errorHandler);
