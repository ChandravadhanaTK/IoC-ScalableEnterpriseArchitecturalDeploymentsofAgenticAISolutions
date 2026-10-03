import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const registerService = async (data) => {
  const { name, email, password } = data;

  const existingUser =
    await prisma.user.findUnique({
      where: { email },
    });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const user =
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const loginService = async (data) => {
  const { email, password } = data;

  const user =
    await prisma.user.findUnique({
      where: { email },
    });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};