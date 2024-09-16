"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv").config();
require("./cronjobs/UpdateAppointmentStatus");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: ["https://slot-lac.vercel.app", "http://localhost:5173"]
}));
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.use("/api/auth", require("./routes/Auth"));
app.use("/api/spaces", require("./routes/Spaces"));
app.use("/api/explore", require("./routes/Explore"));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
