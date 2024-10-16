import express from 'express';
import{
    getLogin,
    postUsers,
    addBook,
    removeBook,
    getUserBooks,
    addReview,
    getReviews
} from '../controllers/GhentARchives.js';

const router = express.Router();

router.route("/login")
    .post(getLogin);
router.route("/register")
    .post(postUsers);
router.route("/addBook")
    .post(addBook);
router.route("/removeBook")
    .post(removeBook);
router.route("/userBooks/:userId")
    .get(getUserBooks);
router.route("/addReview")
    .post(addReview);
router.route("/getReviews/:bookId")
    .get(getReviews);

export default router;
