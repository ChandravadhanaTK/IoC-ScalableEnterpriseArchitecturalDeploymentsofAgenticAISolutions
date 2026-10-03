import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
});

export default mongoose.model("Registration", registrationSchema);
