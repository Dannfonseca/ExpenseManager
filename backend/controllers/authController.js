import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import logger from '../utils/logger.js';

// A função foi movida para dentro deste arquivo
const generateAndSetToken = (res, userId, userRole) => {
    const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido.'),
    password: z.string().min(1, 'A senha é obrigatória.'),
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Usuário já existe.');
  }

  const user = await User.create({ name, email, password });

  if (user) {
    generateAndSetToken(res, user._id, user.role);
    logger.logEvent('AUTH', `Novo usuário registrado: ${email} (ID: ${user._id})`);
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Dados de usuário inválidos.');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Email ou senha inválidos.');
  }
  
  if (user.googleId || user.githubId) {
      res.status(400);
      throw new Error('Este email está associado a um login social. Por favor, use o login com Google ou GitHub.');
  }

  generateAndSetToken(res, user._id, user.role);
  logger.logEvent('AUTH', `Usuário ${email} (ID: ${user._id}) entrou no sistema.`);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  logger.logEvent('AUTH', `Usuário saiu do sistema.`);
  res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

export { registerUser, loginUser, logoutUser };