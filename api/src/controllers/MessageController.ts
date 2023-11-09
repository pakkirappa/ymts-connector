import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/AsyncHandler";
import User, { IUser } from "../models/User";
import { BadRequest, NotFound } from "../errors/Errors";
import Config from "../config";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import {
  messageValidator,
  getMessageValidator,
  getTopicValidator,
} from "../lib/Validations";
import Message from "../models/Message";
import { attachments } from "../lib/Upload";
import { FOLDER_NAMES } from "../constants";
import fs from "fs";
import path from "path";
import Conversation from "../models/Conversation";
import Topic from "../models/Topic";

const router = Router();
const RES_NAME = "Message";

router.post(
  "/",
  attachments.array("attachments", Config.APP.MAX_ATTACHMENTS_UPLOAD_LIMIT),
  validate(messageValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { topic, user } = req.query as { topic: string; user: string };

    if (topic && user) {
      throw new BadRequest("Only one of topic or user is needed at a time");
    }

    const { _id } = req.sender as { _id: string };

    let attachments = [] as string[];

    const uploadedFiles = req.files as Express.Multer.File[];

    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        attachments.push(
          `${Config.APP.HOST}/${FOLDER_NAMES.STATIC_PATH}/${FOLDER_NAMES.ATTACHMENTS}/${file.filename}`
        );
      }
    }

    try {
      if (topic) {
        const message = await Message.create({
          text: req.body.text,
          senderId: _id,
          attachments,
        });

        const toSendTopic = await Topic.findOne({ name: topic });

        if (!toSendTopic) {
          throw new NotFound("Topic not found");
        }

        toSendTopic.messages.push(message._id);

        // todo : send notifications to the users in the topic
      } else if (user) {
        // if this is a single one on one message
        const isUser = await User.findOne({
          $or: [{ email: user }, { userName: user }],
        });

        if (!isUser) {
          throw new NotFound("User not found");
        }

        const message = await Message.create({
          text: req.body.text,
          senderId: _id,
          attachments,
        });

        // check if conversation exists between the two users
        const conversation = await Conversation.findOne({
          $or: [
            { participants: [isUser._id, _id] },
            { participants: [_id, isUser._id] },
          ],
        });

        if (conversation) {
          // add this message to the conversation
          conversation.messages.push(message._id);
          await conversation.save();
        } else {
          // create a new conversation
          await Conversation.create({
            participants: [isUser._id, _id],
            messages: [message._id],
          });
        }

        // todo : send a notification to the user
      } else {
        throw new BadRequest("Topic or User is required");
      }
    } catch (error: any) {
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const toDeletePath = path.join(
            process.cwd(),
            FOLDER_NAMES.PUBLIC,
            FOLDER_NAMES.ATTACHMENTS,
            file.filename
          );

          // if file exists delete it
          if (fs.existsSync(toDeletePath)) {
            fs.unlinkSync(toDeletePath);
          }
        }
      }
      return res
        .status(500)
        .json({ message: error.message || "Something went wrong try again" });
    }
    res.json({ msg: created(RES_NAME) });
  })
);

router.get(
  "/topic/:name",
  validate(getTopicValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { name } = req.params;
    const count = Number(req.query.count) || 10; // getting count of messages to fetch
    // getting topic by name
    const topic = await Topic.findOne({ name });


    if (!topic) {
      throw new NotFound(`Topic with name ${name} not found`);
    }

    // get messages along with the sender details
    const messages = await Message.find(
      { _id: { $in: topic.messages } },
      { text: 1, senderId: 1, attachments: 1 }
    )
      .populate("senderId", { name: 1, userName: 1, email: 1 })
      .limit(count);

    res.json(messages);
  })
);

router.get(
  "/user/:name",
  validate(getMessageValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { name } = req.params;
    const count = Number(req.query.count) || 10; // getting count of messages to fetch
    // get user by id
    const user = await User.findOne({ userName: name });

    if (!user) {
      throw new NotFound(`User with username ${name} Not Found`);
    }

    // get messages along with the sender details
    const messages = await Message.find(
      {
        // there is no reciver id only sender is is there
        senderId: {
          $in: [req.sender._id, user._id],
        },
      },
      { text: 1, senderId: 1, attachments: 1 }
    )
      .populate("senderId", { userName: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(count);

    res.json(messages);
  })
);

export default router;
