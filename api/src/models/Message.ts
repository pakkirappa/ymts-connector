import { Schema, model, Model } from "mongoose";
import { IUser } from "./User";

const MODEL_NAME = "messages";

// Message Schema
export interface IMessage {
  _id: Schema.Types.ObjectId;
  senderId: IUser["_id"];
  text: string;
  createdAt: Date;
  attachments?: string[];
}

// message schema methods
interface IMessageMethods {
  toJson: () => IMessage;
}

// message model
type IMessageModel = Model<IMessage, {}, IMessageMethods>;

const messageSchema = new Schema<IMessage, IMessageModel, IMessageMethods>(
  {
    attachments: {
      type: [String],
      default: [],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default model<IMessage, IMessageModel>(MODEL_NAME, messageSchema);
