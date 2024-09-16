import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { z } from "zod";
import authentication from "../middlewares/authentication";

const ValidatorSpace = z.object({
  Profession: z.string(),
  ShopName: z.string(),
  ImageUrl: z.string().url(),
  State: z.string(),
  City: z.string(),
  Address: z.string(),
  Timing: z.string(),
});

router.post("/CreateSpace", authentication, async (req, res) => {
  try {
    const { Profession, ShopName, ImageUrl, State, City, Address, Timing } =
      ValidatorSpace.parse(req.body);
    const space = await prisma.spaceItems.create({
      data: {
        Profession: Profession,
        ShopName: ShopName,
        ImageUrl: ImageUrl,
        State: State,
        City: City,
        Address: Address,
        Timing: Timing,
        userId: req.body.user.id,
      },
    });
    res.json({ Status: true, space: space });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.get("/GetSpaces", authentication, async (req, res) => {
  try {
    const spaces = await prisma.spaceItems.findMany({
      where: { userId: req.body.user.id },
    });
    res.json({ Status: true, spaces: spaces });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.post("/GetSpaceDetails" ,  async (req, res) => {
  try {
    const space = await prisma.spaceItems.findUnique({
      where: {
        id: req.body.spaceId,
      },
    });
    res.json({ Status: true, space: space });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});


router.get("/GetAllSpaces", async (req, res) => {
  try {
    const spaces = await prisma.spaceItems.findMany({
      select: {
        id : true,
        Profession: true,
        ShopName: true,
        ImageUrl: true,
        State: true,
        City: true,
        Address: true,
        Timing: true,
        userId: true,
      },
    });
    res.json({ Status: true, spaces: spaces });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.post("/GetSpaceAppointments", authentication, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        spaceId: req.body.spaceId,
        status: "ACTIVE",
      },
      select : {
        id: true,
        fromtime: true,
        totime: true,
        status : true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      }
    });
    res.json({ Status: true, appointments: appointments });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

module.exports = router;
