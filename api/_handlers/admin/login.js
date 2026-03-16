import jwt from 'jsonwebtoken';

const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'password123'
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { username, password } = req.body;

        // Verify credentials
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            
            // Generate a specialized admin token
            const token = jwt.sign(
                { id: 'admin-id', role: 'admin', username },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                token,
                user: { username, role: 'admin' }
            });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ success: false, error: 'Admin login failed' });
    }
}
