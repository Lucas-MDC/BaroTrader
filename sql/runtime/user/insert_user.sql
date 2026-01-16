INSERT INTO public.users (username, password_hash, password_salt)
VALUES (${username}, ${password_hash}, ${password_salt})
RETURNING id, username, password_hash, password_salt, created_at;
