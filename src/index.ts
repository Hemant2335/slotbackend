import express from "express";
import cors from "cors";
import { createClient } from "redis";
require("dotenv").config();
import "./cronjobs/UpdateAppointmentStatus";
import { S3, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import authentication from "./middlewares/authentication";

const app = express();
export const Redis = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: 12761,
  },
});
const storage = multer.memoryStorage(); // Store files in memory before uploading
const upload = multer({ storage: storage });

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: process.env.AWS_REGION as string,
});

Redis.on("error", (err) => console.log("Redis Client Error", err));
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ["https://slot-lac.vercel.app", "http://localhost:5173" , "http://ec2-3-110-218-131.ap-south-1.compute.amazonaws.com:5173"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", require("./routes/Auth"));
app.use("/api/spaces", require("./routes/Spaces"));
app.use("/api/explore", require("./routes/Explore"));

app.post(
  "/api/upload",
  authentication,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res
          .status(400)
          .json({ status: false, error: "Please upload a File" });
      } 
      const date = new Date().getDate();
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${date}_${file.originalname}`, // Unique file name
        Body: file.buffer, // Buffer from multer
        ContentType: file.mimetype, // Mime type from multer
      };

      await s3.send(new PutObjectCommand(params));
      
      const signedUrlParams = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: `${date}_${file.originalname}`,
      };
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand(signedUrlParams),
        { expiresIn: 10000 }
      );
      console.log(signedUrl);
      res.status(200).json({ status: true, secure_url: signedUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: "Internal Server Error" });
    }
  }
);

app.listen(3000, async () => {
  await Redis.connect();
  console.log("Server is running on port 3000");
});
