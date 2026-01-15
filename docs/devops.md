# DevOps guide

Este documento e um walkthrough pensado para quem ja ouviu falar de Docker e Compose, mas ainda nao domina um ambiente completo de devops. Vamos entender o comando unico que sobe o BaroTrader, explicar as decisoes e mostrar como cada parte funciona na pratica.

## Docker Compose como orchestrador

### Por que usar Compose?

- **Automatiza o ciclo inteiro**: `docker compose -f compose.yaml -f compose.dev.yaml up --build` constroi as imagens, sobe o banco, aplica as migrations e inicia o app. Esse e o “clone + um comando” que entregamos por meio de `npm run dev:up`.
- **Reproduz o que o ambiente de producao deveria ter**: separar banco, migrations e app em servicos distintos evita atalhos, facilita CI/CD e torna logs mais claros.
- **Facilidade para iniciantes**: o Compose usa YAML para descrever servicos, volumes e variaveis. Quem esta iniciando precisa entender so tres pecas principais para usar: (1) servicos, (2) volumes e (3) variaveis de ambiente.

### Como o Compose esta organizado

1. `compose.yaml` descreve os tres servicos (db, migrate e app) e o volume `pgdata`.
2. `compose.dev.yaml` fornece defaults seguros para desenvolvimento (senhas padrao, mapeamento de portas para localhost, variaveis `DATABASE_URL` e `MIGRATIONS_DATABASE_URL`), sem exigir copia de `.env`.
3. `compose.prod.yaml` e um esqueleto sem defaults: usa `${VAR:?mensagem}` para falhar se uma variavel obrigatoria nao for fornecida, incentivando o uso de secrets reais.

O script `npm run dev:up` chama `scripts/dev.js up`, que:

1. Verifica se o Docker esta rodando (`docker info`).
2. Executa `docker compose` com `compose.yaml` e `compose.dev.yaml`.
3. Usa `--build` para garantir que alteracoes no Dockerfile ou dependencias sejam refletidas em tempo real.

Outros scripts disponiveis:

- `npm run dev:down`: para a stack sem remover dados.
- `npm run dev:reset`: desce os containers e remove os volumes nomeados (limpeza completa do banco).
- `npm run dev:bootstrap`: sobe o banco e executa `npm run db:setup` dentro do container para garantir roles/migrator mesmo quando o volume ja existe.
- `npm run dev:open`: abre o navegador em `http://localhost:3000`.

## Servicos da stack

### db

- Base oficial `postgres:16`.
- Volume nomeado `pgdata` montado em `/var/lib/postgresql/data` para garantir persistencia.
- Scripts dentro de `docker/postgres/init/` mappeados para `/docker-entrypoint-initdb.d` para criar logins e database na primeira criacao do volume.
- `healthcheck` com `pg_isready` e exposicao da porta 5432 no dev para facilitar uso de ferramentas locais.

O script `01_bootstrap_roles.sh` e idempotente: ele verifica se os roles ja existem antes de criar, atualiza owner/senha, garante `CREATEROLE` para o migrator e aceita variaveis `*_FILE` (ex: `DB_PASS_FILE`) para secrets.

### migrate

- Job “one-shot” que roda `npm run db:migrate -- up`.
- Dependente do `db` estar saudavel (`service_healthy`).
- Usa `Dockerfile.dev` com bind-mounts para aproveitar `node_modules` em desenvolvimento.
- `restart: "no"` evidencia falhas de migration; o app so sobe quando esse job conclui com sucesso.

### app

- Depende da conclusao do migrate (`service_completed_successfully`).
- Usa `Dockerfile.dev`, monta o codigo e compartilha o volume `app_node_modules`.
- Escuta em `APP_PORT` (padrao 3000) para ficar separado da porta do banco.
- Roda `npm run dev` (que usa `node --watch`) para hot reload.

## Configuracao e secrets

- `config/db.shared.js` agora respeita `DB_HOST`/`DB_PORT`, permitindo que o Compose use `db` como host interno e o resto do codigo continue funcionado.
- `config/env.js` carrega variaveis `*_FILE` para senhas (DB, migrator, HASH_PEPPER, urls derivadas), alinhando ao padrao de secrets em ambientes reais.
- `src/index.js` le `APP_PORT`, evitando portas hardcoded. Assim, a aplicacao se adapta tanto ao ambiente local quanto ao de producao.

### Boas praticas em uso

- **Separacao de responsabilidades** (db/migrate/app) evita que o app execute migrations; essa mesma abordagem vale para pipelines de CI/CD.
- **Volume nomeado `pgdata`** garante que os dados sobrevivem a `dev:down`; o Compose reusa o volume automaticamente.
- **Scripts npm** (`dev:up`, `dev:up:bg`, `dev:down`, `dev:reset`, `dev:bootstrap`, `dev:open`) encapsulam o comando Compose para quem nao conhece a sintaxe.
- **Documentacao tutorial**: este arquivo e o README agora explicam passo a passo e as decisoes de alto nivel.
- **Fallbacks e checks**: defaults gentis em dev e erros explicitos no prod (via `${VAR:?}`) evitam surpresas.

## Execucao guiada

1. Clone o repo e rode `npm install` (necessario para `npm run dev` localmente).
2. Execute `npm run dev:up`. Isso:
   - constroi a imagem dev,
   - cria o volume `pgdata`,
   - sobe o Postgres e executa `01_bootstrap_roles.sh`,
   - roda as migrations no job `migrate`,
   - inicia o app em `localhost:3000`.
3. Acesse `http://localhost:3000`. Para abrir automaticamente basta `npm run dev:open`.
4. Pare a stack com `npm run dev:down`.
5. Para reiniciar com banco limpo, use `npm run dev:reset`.
6. Para reinstalar logins/migrator sem recriar o volume, rode `npm run dev:bootstrap`.

## Por que as decisoes foram tomadas

- A divisao em tres servicos reflete como times profissionais organizam stacks: banco, jobs agendados e app recebem pipelines separados e logs claros.
- Os scripts no `scripts/dev.js` se comportam como subcomandos (up/down/reset) para esconder complexidade.
- Healthchecks, volumes nomeados e dependencias garantem que a aplicacao nao se conecta a um banco parado.
- O uso de `${VAR:?mensagem}` no `compose.prod.yaml` garante que um deploy falhe rapido quando um segredo está faltando.

## Dicas para iniciantes

- Veja o Compose como um playbook que descreve o que cada container faz.
- Rode `docker compose ps` e `docker compose logs migrate` para monitorar o fluxo.
- Use `npm run dev:up:bg` para subir em background, ou mantenha `npm run dev:up` se quiser os logs no terminal.
- Apague o volume com `npm run dev:reset` quando quiser refazer tudo em branco.
- Edite `docker/postgres/init/*` para personalizar o bootstrap; quando o volume ja existe, use `npm run dev:bootstrap` para reaplicar o setup.
