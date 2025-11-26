-- toda criação de roles de permissão unificadas aqui
-- é necessário dividir as permissões em script separados
-- por funções de negócio

GRANT CREATE ON SCHEMA public TO ${rolname:name};

GRANT SELECT ON ALL TABLES IN 
SCHEMA public TO ${rolname:name};

GRANT INSERT ON ALL TABLES IN 
SCHEMA public TO ${rolname:name};

GRANT UPDATE ON ALL TABLES IN 
SCHEMA public TO ${rolname:name};

GRANT DELETE ON ALL TABLES IN 
SCHEMA public TO ${rolname:name};

GRANT USAGE, SELECT ON ALL SEQUENCES IN 
SCHEMA public TO ${rolname:name};

ALTER DEFAULT PRIVILEGES IN 
SCHEMA public GRANT SELECT ON TABLES TO ${rolname:name};

ALTER DEFAULT PRIVILEGES IN 
SCHEMA public GRANT INSERT ON TABLES TO ${rolname:name};

ALTER DEFAULT PRIVILEGES IN 
SCHEMA public GRANT UPDATE ON TABLES TO ${rolname:name};

ALTER DEFAULT PRIVILEGES IN 
SCHEMA public GRANT DELETE ON TABLES TO ${rolname:name};

ALTER DEFAULT PRIVILEGES IN 
SCHEMA public GRANT USAGE, SELECT 
ON SEQUENCES TO ${rolname:name};


GRANT ${rolname:name} TO ${user:name};