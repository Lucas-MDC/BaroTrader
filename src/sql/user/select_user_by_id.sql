SELECT id, username, password_hash, created_at
  FROM public.users
 WHERE id = ${id}
 LIMIT 1;
