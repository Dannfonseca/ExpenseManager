import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

const registerSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido.'),
    password: z.string().min(1, 'A senha é obrigatória.'),
});

// @desc    Registra um novo usuário
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = registerSchema.parse(req.body);

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Usuário já existe.');
  }

  const user = await User.create({
    email,
    password,
  });

  if (user) {
    logger.logEvent('AUTH', `Novo usuário registrado: ${email} (ID: ${user._id})`);
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Dados de usuário inválidos.');
  }
});

// @desc    Autentica usuário & obtém token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    logger.logEvent('AUTH', `Usuário ${email} (ID: ${user._id}) entrou no sistema.`);
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error('Email ou senha inválidos.');
  }
});

// @desc    Realiza o logout do usuário
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  logger.logEvent('AUTH', `Usuário ${req.user.email} (ID: ${req.user._id}) saiu do sistema.`);
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

export { registerUser, loginUser, logoutUser };