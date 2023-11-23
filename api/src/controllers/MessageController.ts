import { Response, Router } from "express";
import fs from "fs";
import path from "path";
import Config from "../config";
import { FOLDER_NAMES } from "../constants";
import { BadRequest, NotFound } from "../errors/Errors";
import { created } from "../lib/Responses";
import { attachments } from "../lib/Upload";
import {
  getMessageValidator,
  getTopicValidator,
  messageValidator,
} from "../lib/Validations";
import asyncHandler from "../middleware/AsyncHandler";
import { validate } from "../middleware/Validator";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import Topic from "../models/Topic";
import User from "../models/User";

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

        // push a new message to the topic
        toSendTopic.messages.push(message._id);

        await toSendTopic.save();

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

        // todo : send a notification to the user about the message
      } else {
        throw new BadRequest("Topic or User is required");
      }
    } catch (error: any) {
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          // if file exists delete it
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }
      throw error; // throw the error
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
    const page = Number(req.query.page) || 1; // getting count of messages to fetch
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
      .skip((page - 1) * count)
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
    const page = Number(req.query.page) || 1; // getting count of messages to fetch
    // get user by username
    const user = await User.findOne({ userName: name }, { _id: 1 });

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
      { text: 1, senderId: 1, attachments: 1, _id: 0 }
    )
      .populate("senderId", { userName: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * count) // skip the messages based on the page number
      .limit(count);

    res.json(messages);
  })
);

export default router;
