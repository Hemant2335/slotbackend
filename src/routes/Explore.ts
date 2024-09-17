import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { z } from "zod";
import authentication from "../middlewares/authentication";

const ValidatorAppointment = z.object({
  SpaceId: z.string(),
  Time: z.string(),
});

const ValidatorOfflineAppointment = z.object({
  SpaceId: z.string(),
  Time: z.string(),
  MobileNumber: z.string(),
  Name: z.string(),
});

// Helper function to convert time "HH:mm" to total minutes since midnight
const timeToMinutes = (time: any) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

router.post("/BookAppointment", authentication, async (req, res) => {
  try {
    const { SpaceId, Time } = ValidatorAppointment.parse(req.body);
    const timeInMinutes = timeToMinutes(Time);

    // Check if any appointments overlap with the requested time
    const appointments = await prisma.appointments.findMany({
      where: {
        spaceId: SpaceId,
        status: "ACTIVE",
      },
    });
    const IsUserAlreadyBooked = appointments.find(
      (appointment) => appointment.userId === req.body.user.id 
    );
    if (IsUserAlreadyBooked) {
      return res
        .status(400)
        .json({ Status: false, error: "User Already Book" });
    }

    for (let appointment of appointments) {
      const fromtime = timeToMinutes(appointment.fromtime);
      const totime = timeToMinutes(appointment.totime);

      // Check if the requested time falls within any already booked slots
      if (timeInMinutes >= fromtime && timeInMinutes < totime) {
        return res
          .status(400)
          .json({ Status: false, error: "Appointment Already Booked" });
      }
    }

    // Create the new appointment
    const appointment = await prisma.appointments.create({
      data: {
        spaceId: SpaceId,
        fromtime: Time,
        totime:
          parseInt(Time.split(":")[1]) + 15 >= 60
            ? (parseInt(Time.split(":")[0]) + 1).toString().padStart(2, "0") +
              ":00"
            : Time.split(":")[0] +
              ":" +
              (parseInt(Time.split(":")[1]) + 15).toString().padStart(2, "0"),
        userId: req.body.user.id,
      },
    });
    res.json({ Status: true, appointment: appointment });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.post("/BookOfflineAppointment", authentication, async (req, res) => {
  try {
    const { SpaceId, Time , MobileNumber , Name } = ValidatorOfflineAppointment.parse(req.body);
    const timeInMinutes = timeToMinutes(Time);

    // Check if any appointments overlap with the requested time
    const appointments = await prisma.offlineAppointments.findMany({
      where: {
        spaceId: SpaceId,
      },
    });
    const IsUserAlreadyBooked = appointments.find(
      (appointment) => appointment.phone === MobileNumber
    );
    if (IsUserAlreadyBooked) {
      return res
        .status(400)
        .json({ Status: false, error: "User Already Book" });
    }

    for (let appointment of appointments) {
      const fromtime = timeToMinutes(appointment.fromtime);
      const totime = timeToMinutes(appointment.totime);

      // Check if the requested time falls within any already booked slots
      if (timeInMinutes >= fromtime && timeInMinutes < totime) {
        return res
          .status(400)
          .json({ Status: false, error: "Appointment Already Booked" });
      }
    }

    // Create the new appointment
    const appointment = await prisma.offlineAppointments.create({
      data: {
        spaceId: SpaceId,
        fromtime: Time,
        totime:
          parseInt(Time.split(":")[1]) + 15 >= 60
            ? (parseInt(Time.split(":")[0]) + 1).toString().padStart(2, "0") +
              ":00"
            : Time.split(":")[0] +
              ":" +
              (parseInt(Time.split(":")[1]) + 15).toString().padStart(2, "0"),
        phone: MobileNumber,
        name: Name,
        date: new Date(),
      },
    });
    res.json({ Status: true, appointment: appointment });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});


router.post("/FindAvailableSlots", async (req, res) => {
  try {
    let { SpaceId, timeFrom, timeTo } = req.body;
    const appointments = await prisma.appointments.findMany({
      where: {
        spaceId: SpaceId,
        status: "ACTIVE",
      },
    });
    const offlineAppointments = await prisma.offlineAppointments.findMany({
      where: {
        spaceId: SpaceId,
        status: "ACTIVE",
      },
    });
    const d = new Date();
    const localTime = d.getTime();
    const localOffset = d.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const offset = 5.5; // UTC of India Zone is +05.30
    const india = utc + (3600000 * offset);
    const currentTime = new Date(india).getHours();
    console.log(currentTime);
    timeFrom = timeFrom < currentTime ? currentTime : timeFrom; 
    if (timeTo < currentTime) {
      return res.status(200).json({ Status: true, slots: [] });
    }
    const slots = [];
    for (let i = timeFrom; i < timeTo; i++) {
      let Minutes = "00";
      while (parseInt(Minutes) < 60) {
        let slot = {
          time: i + ":" + Minutes.padStart(2, "0"),
          available: true,
          userId: "",
        };

        const slotTimeInMinutes = timeToMinutes(slot.time);

        for (let appointment of appointments) {
          const fromtime = timeToMinutes(appointment.fromtime);
          const totime = timeToMinutes(appointment.totime);

          if (slotTimeInMinutes >= fromtime && slotTimeInMinutes < totime) {
            slot.userId = appointment.userId;
            slot.available = false;
            break;
          }
        }

        for (let appointment of offlineAppointments) {
          const fromtime = timeToMinutes(appointment.fromtime);
          const totime = timeToMinutes(appointment.totime);

          if (slotTimeInMinutes >= fromtime && slotTimeInMinutes < totime) {
            slot.available = false;
            break;
          }
        }

        slots.push(slot);
        Minutes = (parseInt(Minutes) + 15).toString();
      }
    }

    res.json({ Status: true, slots: slots });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

router.get("/GetUserAppointments", authentication, async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        userId: req.body.user.id,
      },
      select: {
        id: true,
        fromtime: true,
        totime: true,
        status: true,
        space: {
          select: {
            ShopName: true,
            Address: true,
            ImageUrl: true,
            City: true,
            Profession: true,
          },
        },
      },
    });
    res.json({ Status: true, appointments: appointments });
  } catch (error) {
    console.log(error);
    res.status(400).json({ Status: false, error: error });
  }
});

module.exports = router;
