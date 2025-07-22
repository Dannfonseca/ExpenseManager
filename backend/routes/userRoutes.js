import express from 'express';
const router = express.Router();
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  createUser,
  getUserById,
  updateUserByAdmin,
  deleteUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';


router.route('/').get(protect, admin, getUsers).post(protect, admin, createUser);


router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);


router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUserByAdmin)
  .delete(protect, admin, deleteUser);

export default router;
