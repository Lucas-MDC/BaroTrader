# Frontend React Migration Contract

Este documento registra o comportamento As-Is das telas HTML/JS antes da migracao
para React. A migracao deve preservar a experiencia do cliente final e alterar
apenas a implementacao interna.

## Rotas antigas e equivalentes

| Tela | Rota antiga | Rota React esperada |
| --- | --- | --- |
| Home | `/` | `/` |
| Register | `/public/static/pages/noSession/register.html` | `/public/static/pages/noSession/register.html` |
| Account | `/private/static/pages/homeInternal.html` | `/private/static/pages/homeInternal.html` |

As rotas antigas continuam validas durante a migracao para nao quebrar links,
redirects e testes futuros. O Express deve servir `/api/*` antes do fallback da
SPA e nao deve retornar HTML da SPA para erros de API.

## Home

Fonte antiga:

- HTML: `src/public/pages/home.html`
- JS: `src/public/assets/js/home.js`

Contrato visual:

- `html[lang="en"]`
- `meta charset="UTF-8"`
- `title`: `Home`
- CSS global: `/static/shared/css/style.css`
- `header > h1`: `Home`
- `main > div.container`
- `section#login-area`
- `section#register-area`

IDs e textos:

- `#login-area`
- `#username-login`, `type="text"`, `placeholder="Username"`
- `#password-login`, `type="password"`, `placeholder="Password"`
- `#login-button`, texto `Login`
- Link `Create an account`

Links e redirects:

- Link de cadastro: `/public/static/pages/noSession/register.html`
- Click em `#login-button`: `event.preventDefault()` e redirect para
  `/private/static/pages/homeInternal.html`

## Register

Fonte antiga:

- HTML: `src/public/pages/noSession/register.html`
- JS: `src/public/assets/js/register.js`

Contrato visual:

- `html[lang="en"]`
- `meta charset="UTF-8"`
- `meta name="viewport" content="width=device-width, initial-scale=1.0"`
- `title`: `Register`
- CSS global: `/static/shared/css/style.css`
- `header > h1`: `Register`
- `header .header-right > a`: `Back`
- `main > div.container`
- `section#register-area`
- `form#register-form`

IDs, textos e atributos nativos:

- `#username-email`
  - `type="text"`
  - `name="username"`
  - `placeholder="Username"`
  - `autocomplete="username"`
  - `required`
  - `pattern="^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$"`
  - `minlength="1"`
  - `maxlength="32"`
  - `title="Use 1-32 characters: lowercase letters, numbers, dot, underscore, or hyphen."`
- `#password-register`
  - `type="password"`
  - `name="password"`
  - `placeholder="Password"`
  - `autocomplete="new-password"`
  - `required`
  - `pattern="^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,64}$"`
  - `minlength="8"`
  - `maxlength="64"`
  - `title="Use 8-64 characters with at least one letter and one number."`
- `#register-button`, `type="submit"`, texto `Register`
- `#register-feedback`, `aria-live="polite"`

Links, fetch e redirects:

- Link `Back`: `/`
- Submit chama `fetch('/api/register')`
- Metodo: `POST`
- Header: `{ 'Content-Type': 'application/json' }`
- Body: `{ username, password }`
- `username` e trimado antes do envio
- `password` preserva o valor digitado
- Se o form nao existe: `Registration form is unavailable.`
- Se `checkValidity()` falha: chama `reportValidity()` e nao faz fetch
- `409`: `User already exists.`
- `400`: `Username or password is invalid.`
- Outros erros HTTP: `data.error || 'Unable to create your account.'`
- Sucesso: `Registration complete! Redirecting...`
- Delay de sucesso: `600 ms`
- Redirect apos sucesso: `/private/static/pages/homeInternal.html`
- Erro de rede: loga `Failed to register user` e mostra
  `Network error while attempting to register.`

Mensagens e cores:

- Erro: `#b91c1c`
- Sucesso: `#047857`

## Account

Fonte antiga:

- HTML: `src/private/pages/homeInternal.html`
- JS: `src/private/assets/js/logged.js`

Contrato visual:

- `html[lang="en"]`
- `meta charset="UTF-8"`
- `meta name="viewport" content="width=device-width, initial-scale=1.0"`
- `title`: `Account`
- CSS global: `/static/shared/css/style.css`
- `header > h1`: `Account`
- `header .header-right`
- `nav > ul`
- `main` vazio

IDs e textos:

- `#logout-button`, texto `Logout`
- Itens de navegacao: `Inventory`, `Market`, `Settings`

Links e redirects:

- Click em `#logout-button`: `event.preventDefault()` e redirect para `/`

## CSS global preservado

O CSS global continua em `src/shared/css/style.css`. A estrutura React deve gerar
markup compativel com estes seletores ja existentes:

- `header`
- `header h1`
- `.header-right`
- `div.container`
- `div.container input`
- `div.container button`
- `section`
- `nav ul`
- `nav ul li`
