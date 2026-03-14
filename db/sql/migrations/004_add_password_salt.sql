ALTER TABLE public.users
    ADD COLUMN password_salt TEXT NOT NULL;
