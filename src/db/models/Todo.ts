import { Schema, model } from "mongoose";

export type TodoDoc = {
  userEmail: string;
  id: number;
  text: string;
  completed: boolean;
};

const TodoSchema = new Schema<TodoDoc>(
  {
    userEmail: { type: String, required: true, index: true },
    id: { type: Number, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

TodoSchema.index({ userEmail: 1, id: 1 }, { unique: true });

export const Todo = model<TodoDoc>("Todo", TodoSchema);
