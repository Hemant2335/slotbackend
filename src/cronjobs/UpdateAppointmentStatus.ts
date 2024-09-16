import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

cron.schedule('* * * * *', async () => {
  try {
    console.log("Cron Job Running")
    const currentTime = new Date();
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    // Find all appointments that have passed their totime and are not marked as expired
    const Appointments = await prisma.appointments.findMany({
      where: {
        status: "ACTIVE" // Only check active appointments
      }
    });
    const expiredAppointments = Appointments.filter(appointment => {
        const totimehrs = appointment.totime.split(":")[0];
        const totimemin = appointment.totime.split(":")[1];
        const totime = parseInt(totimehrs) * 60 + parseInt(totimemin);
        return totime < currentMinutes;
    });

    const OfflineAppointments = await prisma.offlineAppointments.findMany({
      
    });

    // Update those appointments to mark them as "Expired"
    for (let appointment of expiredAppointments) {
      await prisma.appointments.update({
        where: { id: appointment.id },
        data: { status: 'EXPIRED' }
      });
    }

    console.log(`Expired appointments updated at ${currentTime}`);
  } catch (error) {
    console.error('Error while updating expired appointments:', error);
  }
});
