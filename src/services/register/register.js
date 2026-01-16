import { Router } from 'express';
import { RegistrationError, registerUser } from './registerService.js';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        const user = await registerUser({ username, password });

        return res.status(201).json({
            id: user.id,
            username: user.username,
            createdAt: user.createdAt
        });
        
    } catch (err) {
        if (err instanceof RegistrationError) {
            return res.status(err.statusCode || 400).json({ error: err.message });
        }

        console.error('Failed to register user', err);
        return res.status(500).json({ error: 'Erro ao registrar usuario' });
    }
});

export default router;
