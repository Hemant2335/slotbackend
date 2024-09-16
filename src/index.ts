import express from "express";
import cors from "cors"
require("dotenv").config();
import "./cronjobs/UpdateAppointmentStatus";


const app = express();
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: ["https://onechatfrontend.vercel.app", "http://localhost:5173" ,"https://slot-lac.vercel.app/"]
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