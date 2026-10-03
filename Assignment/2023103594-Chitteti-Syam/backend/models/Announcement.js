import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  date: String,
});

export default mongoose.model("Announcement", announcementSchema);
