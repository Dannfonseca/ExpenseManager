import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const updateProfileSchema = z.object({
  email: z.string().email('Email inválido.').optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.').optional(),
  monthlyGoal: z.number().positive('A meta deve ser um número positivo.').optional()
});

const createUserSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  role: z.enum(['user', 'admin']),
});

const adminUpdateUserSchema = z.object({
  email: z.string().email('Email inválido.').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { email, password, role } = createUserSchema.parse(req.body);

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Usuário já existe com este e-mail.');
  }

  const user = await User.create({ email, password, role });

  if (user) {
    logger.logEvent('AUTH', `Admin ${req.user.email} criou um novo usuário: ${email} (Role: ${role})`);
    res.status(201).json({ _id: user._id, email: user.email, role: user.role });
  } else {
    res.status(400);
    throw new Error('Dados de usuário inválidos.');
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({ _id: user._id, email: user.email, monthlyGoal: user.monthlyGoal });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { email, password, monthlyGoal } = updateProfileSchema.parse(req.body);
    user.email = email || user.email;
    if (typeof monthlyGoal === 'number') {
      user.monthlyGoal = monthlyGoal;
    }
    if (password) {
      user.password = password;
    }
    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, email: updatedUser.email, monthlyGoal: updatedUser.monthlyGoal });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    const { email, role } = adminUpdateUserSchema.parse(req.body);
    const originalData = { email: user.email, role: user.role };
    
    user.email = email || user.email;
    user.role = role || user.role;
    
    const updatedUser = await user.save();
    logger.logEvent('AUTH', `Admin ${req.user.email} atualizou o usuário ${user._id}. De: ${JSON.stringify(originalData)} Para: ${JSON.stringify({email: user.email, role: user.role})}`);
    res.json({ _id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Não é possível deletar um usuário administrador.');
    }
    const userEmail = user.email;
    await user.deleteOne();
    logger.logEvent('AUTH', `Admin ${req.user.email} deletou o usuário: ${userEmail}`);
    res.json({ message: 'Usuário removido com sucesso.' });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }
});

export { getUserProfile, updateUserProfile, getUsers, createUser, getUserById, updateUserByAdmin, deleteUser };