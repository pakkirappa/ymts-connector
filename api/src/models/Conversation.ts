import { Schema, model, Model } from "mongoose";
import { IUser } from "./User";
import { IMessage } from "./Message";

const MODEL_NAME = "conversations";

// Conversation Schema
export interface IConversation {
  _id: Schema.Types.ObjectId;
  participants: IUser["_id"][];
  messages: IMessage["_id"][];
  createdAt: Date;
  updatedAt: Date;
}

// conversation schema methods
interface IConversationMethods {
  toJson: () => IConversation;
}

// conversation model
type IConversationModel = Model<IConversation, {}, IConversationMethods>;

const conversationSchema = new Schema<
  IConversation,
  IConversationModel,
  IConversationMethods
>(
  {
    messages: {
      type: [Schema.Types.ObjectId],
      ref: "messages",
      default: [],
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "users",
      default: [],
    },
  },
  { timestamps: true }
);

export default model<IConversation, IConversationModel>(
  MODEL_NAME,
  conversationSchema
);
