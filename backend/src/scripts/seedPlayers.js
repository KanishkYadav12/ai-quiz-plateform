import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";

const DEFAULT_COUNT = 25;
const DEFAULT_PASSWORD = "Password@123";

const firstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Krishna",
  "Ishaan",
  "Priyanshu",
  "Kanishk",
  "Rohan",
  "Arjun",
  "Dev",
  "Neha",
  "Ananya",
  "Ira",
  "Meera",
  "Riya",
  "Kabir",
  "Saanvi",
  "Nisha",
  "Rahul",
  "Aisha",
  "Aditi",
  "Yash",
  "Tanya",
  "Kiran",
  "Sneha",
  "Ankit",
  "Reyansh",
  "Simran",
  "Nikhil",
  "Siddhi",
];

const lastNames = [
  "Sharma",
  "Verma",
  "Yadav",
  "Gupta",
  "Singh",
  "Khan",
  "Mehta",
  "Joshi",
  "Reddy",
  "Patel",
  "Jain",
  "Kapoor",
  "Malhotra",
  "Nair",
  "Chopra",
];

const sampleBadges = [
  "FAST_FINGER",
  "CONSISTENT_PLAYER",
  "QUIZ_CHAMP",
  "STREAK_MASTER",
  "TOP_10",
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const makePlayer = (idx) => {
  const f = firstNames[idx % firstNames.length];
  const l = lastNames[idx % lastNames.length];
  const gamesPlayed = rand(8, 80);
  const gamesWon = rand(0, Math.max(0, Math.floor(gamesPlayed * 0.6)));
  const totalCoins = rand(120, 5000);
  const totalScore = rand(500, 30000);
  const bestScore = rand(
    80,
    Math.max(80, Math.floor(totalScore / Math.max(1, gamesPlayed)) + 300),
  );
  const winStreak = rand(0, 12);
  const coinRatio = Number((totalCoins / Math.max(1, gamesPlayed)).toFixed(2));

  const badgeCount = rand(0, 2);
  const badges = sampleBadges.slice(0, badgeCount);

  return {
    name: `${f} ${l} ${idx + 1}`,
    email: `player${idx + 1}@seed.quizai.local`,
    password: DEFAULT_PASSWORD,
    profilePicture: "",
    totalCoins,
    gamesPlayed,
    gamesWon,
    winStreak,
    coinRatio,
    totalScore,
    bestScore,
    badges,
  };
};

const seedPlayers = async (count = DEFAULT_COUNT) => {
  const mongoUrl = process.env.MONGODB_URL;

  if (!mongoUrl) {
    throw new Error("Missing MONGODB_URL in environment.");
  }

  await mongoose.connect(mongoUrl, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  let created = 0;
  let updated = 0;

  for (let i = 0; i < count; i += 1) {
    const p = makePlayer(i);

    const existing = await User.findOne({ email: p.email });

    if (!existing) {
      await User.create(p);
      created += 1;
      continue;
    }

    existing.name = p.name;
    existing.profilePicture = p.profilePicture;
    existing.totalCoins = p.totalCoins;
    existing.gamesPlayed = p.gamesPlayed;
    existing.gamesWon = p.gamesWon;
    existing.winStreak = p.winStreak;
    existing.coinRatio = p.coinRatio;
    existing.totalScore = p.totalScore;
    existing.bestScore = p.bestScore;
    existing.badges = p.badges;

    // Keep existing accounts valid if they were created without a usable hash.
    if (!existing.password) {
      existing.password = hashedPassword;
    }

    await existing.save();
    updated += 1;
  }

  console.log(`Seed completed. Created: ${created}, Updated: ${updated}`);
  console.log(`Default password for seeded users: ${DEFAULT_PASSWORD}`);
};

const countArg = Number(process.argv[2]);
const count =
  Number.isFinite(countArg) && countArg > 0 ? countArg : DEFAULT_COUNT;

seedPlayers(count)
  .catch((err) => {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
