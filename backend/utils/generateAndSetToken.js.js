import jwt from 'jsonwebtoken';

// Esta função define o token como um cookie na resposta
const generateAndSetToken = (res, userId, userRole) => {
    const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true, // Impede acesso via JavaScript
        secure: process.env.NODE_ENV !== 'development', // Usa https em produção
        sameSite: 'strict', // Proteção contra ataques CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    });
};

export default generateAndSetToken;