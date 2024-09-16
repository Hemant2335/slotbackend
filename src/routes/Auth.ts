import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authentication from "../middlewares/authentication";
require("dotenv").config();
import z from "zod";

const ValidateRegister = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string(),
  type: z.enum(["USER", "BUSINESS", "ADMIN"]),
});

const ValidateLogin = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = ValidateLogin.parse(req.body);
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(400).json({ Status: false, error: "User not found" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ Status: false, error: "Invalid Password" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret");
    res.json({ Status: true, token: token, user: user });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, name, password, type } = ValidateRegister.parse(req.body);

    // Check if email already exists
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });
    if (user) {
      return res
        .status(400)
        .json({ Status: false, error: "User already exists" });
    }
    // Encrypt password
    const hashedpassword = await bcrypt.hash(password, 10);
    // Create user

    const newuser = await prisma.user.create({
      data: {
        email: email,
        password: hashedpassword,
        name: name,
        type: type,
      },
    });
    const token = jwt.sign(
      { id: newuser.id },
      process.env.JWT_SECRET || "secret"
    );
    res.json({ Status: true, token: token });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: "Internal Server Error" });
  }
});

router.get("/getuser", authentication, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: (req as any).body.user.id,
      },
      select: {
        name: true,
        email: true,
        type: true,
        password: false,
        id: true,
      },
    });
    res.json({ Status: true, user: user });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: "Internal Server Error" });
  }
});

module.exports = router;
