import "dotenv/config";
import mongoose from "mongoose";
import Announcement from "./models/Announcement.js";
import Event from "./models/Event.js";

const events = [
  {
    title: "AI Innovation Workshop",
    description: "A hands-on introduction to AI concepts, responsible AI, and student innovation projects.",
    date: "2026-11-12",
    location: "Computer Science Lab, Block A",
    registrationOpen: true,
    capacity: 80,
  },
  {
    title: "Tech Symposium 2026",
    description: "A day of student project presentations, technical talks, and department exhibits.",
    date: "2026-11-20",
    location: "Main Auditorium",
    registrationOpen: true,
    capacity: 200,
  },
  {
    title: "Web Development Bootcamp",
    description: "Build a responsive web application while learning modern HTML, CSS, and JavaScript.",
    date: "2026-12-03",
    location: "Digital Learning Lab",
    registrationOpen: false,
    capacity: 40,
  },
  {
    title: "Cloud Computing Seminar",
    description: "Explore cloud computing fundamentals, deployment options, and common cloud services.",
    date: "2026-12-15",
    location: "Engineering Lecture Hall",
    registrationOpen: true,
    capacity: 120,
  },
];

const announcements = [
  {
    title: "Internship Registration Announcement",
    content: "Students interested in the upcoming internship program should submit their registration through the placement office by the published deadline.",
    date: "2026-10-12",
  },
  {
    title: "Technical Symposium Announcement",
    content: "Project presentation and technical talk registrations are open for the department's 2026 technical symposium.",
    date: "2026-10-18",
  },
  {
    title: "Coding Contest Announcement",
    content: "The campus coding contest is open to all students. Contact the Computer Science department for participation details.",
    date: "2026-10-24",
  },
];

async function seedDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Set MONGODB_URI in backend/.env before running the seed script");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const event of events) {
    await Event.findOneAndUpdate(
      { title: event.title },
      { $setOnInsert: event },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  for (const announcement of announcements) {
    await Announcement.findOneAndUpdate(
      { title: announcement.title },
      { $setOnInsert: announcement },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Seeded ${events.length} sample events and ${announcements.length} sample announcements`);
}

seedDatabase()
  .catch((error) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
