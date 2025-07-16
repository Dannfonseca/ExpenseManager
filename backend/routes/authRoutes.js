import express from 'express';
const router = express.Router();
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

export default router;