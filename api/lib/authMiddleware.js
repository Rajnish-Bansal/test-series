import jwt from 'jsonwebtoken';

export const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        return decoded;
    } catch (err) {
        console.error('JWT verification failed:', err);
        return null;
    }
};
