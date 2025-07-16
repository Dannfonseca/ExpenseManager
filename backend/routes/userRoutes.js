/*
 * Corrigido o arquivo de rotas de usuário para usar os controllers corretos.
 * - As rotas agora correspondem às operações de CRUD de usuários (get, create, update, delete).
 * - Adicionada a proteção de rotas para garantir que apenas administradores possam gerenciar usuários.
 */
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

// Rotas de gerenciamento de usuários (acessíveis apenas por administradores)
router.route('/').get(protect, admin, getUsers).post(protect, admin, createUser);

// Rotas de perfil do usuário logado
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Rotas de gerenciamento para um usuário específico (acessíveis apenas por administradores)
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUserByAdmin)
  .delete(protect, admin, deleteUser);

export default router;
