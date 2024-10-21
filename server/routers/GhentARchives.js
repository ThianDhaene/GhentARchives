import express from 'express';

import{
    getAllMarkers
} from '../controllers/GhentARchives.js';

const router = express.Router();

router.get('/markers', getAllMarkers);

export default router;
