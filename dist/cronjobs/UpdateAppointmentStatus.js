"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Cron Job Running");
        const currentTime = new Date();
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        // Find all appointments that have passed their totime and are not marked as expired
        const Appointments = yield prisma.appointments.findMany({
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
        const OfflineAppointments = yield prisma.offlineAppointments.findMany({});
        // Update those appointments to mark them as "Expired"
        for (let appointment of expiredAppointments) {
            yield prisma.appointments.update({
                where: { id: appointment.id },
                data: { status: 'EXPIRED' }
            });
        }
        console.log(`Expired appointments updated at ${currentTime}`);
    }
    catch (error) {
        console.error('Error while updating expired appointments:', error);
    }
}));
