INSERT INTO public.users (username, password_hash)
VALUES (${username}, ${password_hash})
RETURNING id, username, password_hash, created_at;
