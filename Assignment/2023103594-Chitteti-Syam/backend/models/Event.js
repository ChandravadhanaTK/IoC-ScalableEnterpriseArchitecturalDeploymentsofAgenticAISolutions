import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: String,
  location: String,
  registrationOpen: { type: Boolean, default: true },
  capacity: { type: Number, default: 100 },
});

export default mongoose.model("Event", eventSchema);
