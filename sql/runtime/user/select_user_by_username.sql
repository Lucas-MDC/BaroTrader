SELECT id, username, password_hash, password_salt, created_at
  FROM public.users
 WHERE username = ${username}
 LIMIT 1;
