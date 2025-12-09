import { db } from '../pool.js';
import { createUserModel } from '../../../models/user/userModel.js';

async function runAsUser() {
    console.log('Running operations as application user...');
    
    const userModel = createUserModel(db);
    const username = `dev_user_${Date.now()}`;
    const passwordHash = 'hashed-password-placeholder';

    const created = await userModel.createUser({
        username,
        passwordHash
    });

    const fetchedByUsername = await userModel.findByUsername(username);
    const fetchedById = await userModel.findById(created?.id);

    if (!fetchedByUsername || fetchedByUsername.id !== created?.id) {
        throw new Error('Smoke test failed: fetch by username mismatch');
    }

    if (!fetchedById || fetchedById.id !== created?.id) {
        throw new Error('Smoke test failed: fetch by id mismatch');
    }

    console.log('User smoke test succeeded:', {
        id: fetchedById.id,
        username: fetchedById.username,
        createdAt: fetchedById.createdAt
    });
}

export { runAsUser };
