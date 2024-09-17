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
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const zod_1 = require("zod");
const authentication_1 = __importDefault(require("../middlewares/authentication"));
const ValidatorSpace = zod_1.z.object({
    Profession: zod_1.z.string(),
    ShopName: zod_1.z.string(),
    ImageUrl: zod_1.z.string().url(),
    State: zod_1.z.string(),
    City: zod_1.z.string(),
    Address: zod_1.z.string(),
    Timing: zod_1.z.string(),
});
router.post("/CreateSpace", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Profession, ShopName, ImageUrl, State, City, Address, Timing } = ValidatorSpace.parse(req.body);
        const space = yield prisma.spaceItems.create({
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
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ Status: false, error: error });
    }
}));
router.get("/GetSpaces", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const spaces = yield prisma.spaceItems.findMany({
            where: { userId: req.body.user.id },
        });
        res.json({ Status: true, spaces: spaces });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ Status: false, error: error });
    }
}));
router.post("/GetSpaceDetails", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const space = yield prisma.spaceItems.findUnique({
            where: {
                id: req.body.spaceId,
            },
        });
        res.json({ Status: true, space: space });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ Status: false, error: error });
    }
}));
router.get("/GetAllSpaces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const spaces = yield prisma.spaceItems.findMany({
            select: {
                id: true,
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
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ Status: false, error: error });
    }
}));
router.post("/GetSpaceAppointments", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointments = yield prisma.appointments.findMany({
            where: {
                spaceId: req.body.spaceId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                fromtime: true,
                totime: true,
                status: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            }
        });
        const offlineAppointments = yield prisma.offlineAppointments.findMany({
            where: {
                spaceId: req.body.spaceId,
                status: "ACTIVE"
            },
            select: {
                id: true,
                fromtime: true,
                totime: true,
                status: true,
                phone: true,
                name: true
            }
        });
        res.json({ Status: true, appointments: { appointments: appointments, offlineAppointments: offlineAppointments } });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ Status: false, error: error });
    }
}));
module.exports = router;
