import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/AsyncHandler";
import User, { IUser } from "../models/User";
import { BadRequest, NotFound } from "../errors/Errors";
import Config from "../config";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import { idValidater, messageValidator } from "../lib/Validations";
import Message from "../models/Message";
import { attachments } from "../lib/Upload";
import { FOLDER_NAMES } from "../constants";
import fs from "fs";
import path from "path";
import Conversation from "../models/Conversation";
import Topic from "../models/Topic";

const router = Router();
const RES_NAME = "Message Sent Successfully";

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

        const toSendTopic = await Topic.findById(topic);

        if (!toSendTopic) {
          throw new NotFound("Topic not found");
        }

        toSendTopic.messages.push(message._id);

        // todo : send notifications to the users in the topic
      } else if (user) {
        const isUser = await User.findById(user);

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
            { user1: user, user2: _id },
            { user1: _id, user2: user },
          ],
        });

        if (conversation) {
          // add this message to the conversation
          conversation.messages.push(message._id);
          await conversation.save();
        } else {
          // create a new conversation
          await Conversation.create({
            participants: [user, _id],
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
            __dirname,
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
  "/topic/:id",
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    // getting topic by id
    const topic = await Topic.findById(id);

    if (!topic) {
      throw new NotFound("Topic not found");
    }

    // get messages along with the sender details
    const messages = await Message.find(
      { _id: { $in: topic.messages } },
      { text: 1, senderId: 1, attachments: 1 }
    )
      .populate("senderId", { name: 1, userName: 1, email: 1 })
      .limit(20);

    res.json(messages);
  })
);

router.get(
  "/user/:userId",
  asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.params;
    // get user by id
    const topic = await User.findById(userId);

    if (!topic) {
      throw new NotFound("User not found");
    }

    // get messages along with the sender details
    const messages = await Message.find(
      {
        $or: [
          { senderId: req.sender._id, receiverId: userId },
          { senderId: userId, receiverId: req.sender._id },
        ],
      },
      { text: 1, senderId: 1, attachments: 1 }
    )
      .populate("senderId", { name: 1, userName: 1, email: 1 })
      .limit(20);

    res.json(messages);
  })
);

export default router;
