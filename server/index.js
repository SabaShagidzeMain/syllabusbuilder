import e from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerProfessor } from "./registerProfessor.js";

dotenv.config();

const app = e();
app.use(cors());
app.use(e.json());

app.post("/api/registerProfessor", registerProfessor);

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
