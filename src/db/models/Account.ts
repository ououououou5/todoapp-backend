import { Schema, model } from "mongoose";

export type AccountDoc = {
  email: string;
  password: string;
};

const AccountSchema = new Schema<AccountDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const Account = model<AccountDoc>("Account", AccountSchema);
