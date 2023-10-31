import { Schema, model, Model } from "mongoose";
import { IUser } from "./User";
import { IMessage } from "./Message";

const MODEL_NAME = "topics";

// Topic Schema
export interface ITopic {
  _id: Schema.Types.ObjectId;
  name: string;
  description: string;
  users: IUser["_id"][]; // members of the topic
  messages: IMessage["_id"][]; // messages in the topic
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Topic schema methods
interface ITopicMethods {
  toJson: () => ITopic;
}

// Topic model
type ITopicModel = Model<ITopic, {}, ITopicMethods>;

const topicSchema = new Schema<ITopic, ITopicModel, ITopicMethods>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: "users",
      default: [],
      validate: {
        validator: (members: IUser["_id"][]) => {
          return members.length > 0;
        },
        message: "A topic must have at least two(2) member(s)",
      },
    },
    messages: {
      type: [Schema.Types.ObjectId],
      ref: "messages",
      default: [],
    },
  },
  { timestamps: true }
);

export default model<ITopic, ITopicModel>(MODEL_NAME, topicSchema);
