import connectToDatabase from './lib/db.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    await connectToDatabase();

    const { method } = req;

    switch (method) {
        case 'POST': {
            const { action, username, mobile, password, name } = req.body;

            if (action === 'signup') {
                try {
                    const identifier = username || mobile;
                    if (!identifier || !password) {
                        return res.status(400).json({ success: false, error: 'Username and password are required.' });
                    }

                    // Check for existing user
                    const existingUser = username
                        ? await User.findOne({ username: username.toLowerCase().trim() })
                        : await User.findOne({ mobile });

                    if (existingUser) {
                        const errMsg = username ? 'Username already taken. Please choose another.' : 'Mobile number already registered.';
                        return res.status(400).json({ success: false, error: errMsg });
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const userData = {
                        password: hashedPassword,
                        name: name || username || mobile || 'Aspirant',
                    };
                    if (username) userData.username = username.toLowerCase().trim();
                    if (mobile) userData.mobile = mobile;

                    const user = await User.create(userData);

                    const token = jwt.sign(
                        { id: user._id, username: user.username, mobile: user.mobile, name: user.name },
                        process.env.JWT_SECRET || 'fallback_secret',
                        { expiresIn: '30d' }
                    );

                    return res.status(201).json({
                        success: true,
                        token,
                        user: { id: user._id, name: user.name, username: user.username, mobile: user.mobile }
                    });
                } catch (error) {
                    console.error('Signup error:', error);
                    return res.status(500).json({ success: false, error: 'Failed to create account' });
                }

            } else if (action === 'login') {
                try {
                    let user = null;
                    if (username) {
                        user = await User.findOne({ username: username.toLowerCase().trim() });
                    } else if (mobile) {
                        user = await User.findOne({ mobile });
                    }

                    if (!user) {
                        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
                    }

                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) {
                        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
                    }

                    const token = jwt.sign(
                        { id: user._id, username: user.username, mobile: user.mobile, name: user.name },
                        process.env.JWT_SECRET || 'fallback_secret',
                        { expiresIn: '30d' }
                    );

                    return res.status(200).json({
                        success: true,
                        token,
                        user: { id: user._id, name: user.name, username: user.username, mobile: user.mobile }
                    });
                } catch (error) {
                    console.error('Login error:', error);
                    return res.status(500).json({ success: false, error: 'Login failed' });
                }
            }
            break;
        }
        default:
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}
