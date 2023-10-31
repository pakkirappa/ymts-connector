import { Schema, model, Model } from "mongoose";
import Config from "../config";
import jwt from "jsonwebtoken";

// token interface
interface AuthToken {
  _id: string;
}

const MODEL_NAME = "users";

// user interface
export interface IUser {
  _id: Schema.Types.ObjectId;
  name: string;
  userName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// user schema methods
interface IUserMethods {
  toJson: () => IUser;
  generateToken: () => string;
  checkToken: (token: string) => Promise<IUser | null>;
}

// user model
type IUserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      validate: {
        validator: (email: string) => {
          return /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/.test(email);
        },
        message: "Invalid email",
      },
      required: true,
    },
  },
  { timestamps: true }
);

// add methods to the schema
userSchema.methods.toJson = function () {
  const user = this.toObject();
  delete user.password;
  delete this._v;
  return user;
};

// we can add the methods to the schema like this
userSchema.methods.generateToken = function () {
  const token = jwt.sign({ _id: this._id }, Config.AUTH.JWT_SECRET, {
    expiresIn: Config.AUTH.JWT_EXPIRES_IN,
    issuer: Config.AUTH.JWT_ISSUER,
  });
  return token;
};


// add index on username and email
userSchema.index({ username: 1, email: 1 });

export default model<IUser, IUserModel>(MODEL_NAME, userSchema);
