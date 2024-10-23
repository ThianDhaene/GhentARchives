import express from 'express';

import{
    getAllMarkers,
    getMarkerById
} from '../controllers/GhentARchives.js';

const router = express.Router();

router.get('/markers', getAllMarkers);
router.get('/markers/:id', getMarkerById);

export default router;
