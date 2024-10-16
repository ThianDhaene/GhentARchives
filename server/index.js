import express from "express";
import cors from 'cors';
import router from './routers/GhentARchives.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1/ghentarchives", router );

app.listen(3000, () => {console.log('Server is running on http://localhost:3000/api/v1/users')});