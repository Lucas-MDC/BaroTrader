SELECT id, username, password_hash, password_salt, created_at
  FROM public.users
 WHERE id = ${id}
 LIMIT 1;
