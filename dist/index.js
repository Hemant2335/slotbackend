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
exports.Redis = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const redis_1 = require("redis");
require("dotenv").config();
require("./cronjobs/UpdateAppointmentStatus");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
exports.Redis = (0, redis_1.createClient)({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 12761,
    },
});
const storage = multer_1.default.memoryStorage(); // Store files in memory before uploading
const upload = (0, multer_1.default)({ storage: storage });
const s3 = new client_s3_1.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
    region: process.env.AWS_REGION,
});
exports.Redis.on("error", (err) => console.log("Redis Client Error", err));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    credentials: true,
    origin: ["https://slot-lac.vercel.app", "http://localhost:5173"],
}));
app.get("/", (req, res) => {
    res.send("Hello World");
});
app.use("/api/auth", require("./routes/Auth"));
app.use("/api/spaces", require("./routes/Spaces"));
app.use("/api/explore", require("./routes/Explore"));
app.post("/api/upload", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ status: false, error: "Please upload a File" });
        }
        const params = {
            Bucket: "your-bucket-name",
            Key: `${Date.now()}_${file.originalname}`, // Unique file name
            Body: file.buffer, // Buffer from multer
            ContentType: file.mimetype, // Mime type from multer
        };
        yield s3.send(new client_s3_1.PutObjectCommand(params));
        const signedUrlParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${Date.now()}_${file.originalname}`,
        };
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.GetObjectCommand(signedUrlParams), { expiresIn: 1000000 });
        console.log(signedUrl);
        res.status(200).json({ status: true, imgurl: signedUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
}));
app.listen(3000, () => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.Redis.connect();
    console.log("Server is running on port 3000");
}));
