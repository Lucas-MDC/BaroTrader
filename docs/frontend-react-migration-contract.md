# Frontend React SPA Contract

Este documento define o contrato vigente entre o frontend React, o roteamento
HTTP do Express, os arquivos publicos e os servicos da aplicacao. As antigas
paginas HTML individuais e seus caminhos `/public/static/pages/*` e
`/private/static/pages/*` nao fazem mais parte do contrato.

## Responsabilidades

### React

- Renderiza as paginas da aplicacao.
- Resolve navegacoes internas depois que o shell foi carregado.
- Atualiza a URL e o historico do navegador por meio de `react-router-dom`.
- Usa `Link` para links internos e `useNavigate` para navegacoes posteriores a
  login, registro e logout.

### Express

- Entrega o mesmo shell `src/frontend/index.html` para rotas validas da SPA.
- Entrega recursos publicos fixos por meio de `express.static`.
- Entrega somente o bundle exato usado para iniciar a SPA, sem montar o
  diretorio de build como um diretorio publico.
- Processa servicos sob `/api` antes das rotas da SPA.
- Retorna 404 para caminhos desconhecidos e nunca usa o shell como resposta de
  fallback para `/api/*`.

## Rotas canonicas da SPA

| Pagina | Rota | Componente |
| --- | --- | --- |
| Home e login | `/` | `Home` |
| Registro | `/register` | `Register` |
| Conta | `/account` | `Account` |

Em uma navegacao interna, essas mudancas de pagina nao geram uma nova
requisicao de documento ao Express. Abrir uma rota diretamente, atualizar a
pagina ou abrir um link em outra aba exige um GET inicial; nesse caso, o Express
entrega o shell e o React renderiza a rota correspondente.

`/account` e uma rota visual publica. O seu esqueleto pode ser renderizado sem
sessao. Dados privados exibidos futuramente nessa pagina devem vir de servicos
protegidos com autenticacao, que constituem a fronteira real de seguranca.

## Ordem do roteamento HTTP

O roteador Express deve manter esta precedencia:

1. Recursos fixos em `/static/assets`.
2. Bundle exato em `/spa/app.js`.
3. Servicos em `/api`.
4. Shell para `/`, `/register` e `/account`.
5. Resposta 404.
6. Tratamento de erros.

## Recursos publicos fixos

Arquivos versionados e publicos ficam sob `src/public/assets`:

```text
src/public/assets/
  css/
  images/
  icons/
  fonts/
```

Somente as subpastas `css`, `images`, `icons` e `fonts` sao montadas pelo
Express sob `/static/assets`. Outros diretorios dentro de `assets`, inclusive um
eventual `assets/build`, nao sao publicos. Exemplos:

| Arquivo | URL |
| --- | --- |
| `src/public/assets/css/style.css` | `/static/assets/css/style.css` |
| `src/public/assets/images/logo.png` | `/static/assets/images/logo.png` |
| `src/public/assets/icons/favicon.svg` | `/static/assets/icons/favicon.svg` |
| `src/public/assets/fonts/inter.woff2` | `/static/assets/fonts/inter.woff2` |

Diretorios nao devem oferecer listagem. Arquivos privados, uploads protegidos,
configuracoes e segredos nao podem ser colocados nessa arvore.

## Bundle da SPA

O esbuild gera somente:

```text
src/public/build/app.js
```

O diretorio `src/public/build` e ignorado pelo Git e nao e montado por
`express.static`. O Express entrega o arquivo exato em:

```text
GET /spa/app.js
```

Essa URL precisa existir porque o navegador deve baixar o JavaScript que inicia
a SPA. Ela pode ser aberta diretamente como qualquer recurso HTTP, mas nao
permite acessar outros nomes ou navegar pelo diretorio de build.

## Servicos

As operacoes abaixo continuam sendo requisicoes ao backend porque criam,
consultam ou removem recursos:

| Metodo e caminho | Responsabilidade |
| --- | --- |
| `POST /api/register` | Criar usuario e iniciar sua sessao |
| `POST /api/login` | Autenticar usuario e iniciar sua sessao |
| `DELETE /api/logout` | Encerrar a sessao atual |

Servicos protegidos futuros devem usar a autenticacao JWT antes de retornar
informacoes da conta.

## Sessao criada pelo registro

Um registro bem-sucedido deve:

1. Criar o usuario.
2. Emitir um JWT com a mesma politica usada pelo login.
3. Gravar o JWT no mesmo cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
4. Retornar status 201 e somente dados publicos do usuario.
5. Permitir que o React navegue para `/account` sem uma segunda chamada a
   `/api/login` e sem recarregar o documento.

## Home

Contrato visual:

- `title`: `Home`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Home`
- `main > div.container`
- `section#login-area`
- `section#register-area`

IDs e textos:

- `#username-login`, `type="text"`, `placeholder="Username"`
- `#password-login`, `type="password"`, `placeholder="Password"`
- `#login-button`, texto `Login`
- Link `Create an account`, com destino `/register`

Fluxo:

- O submit chama `POST /api/login`.
- Sucesso navega para `/account` pelo React Router.
- Erros permanecem na pagina e exibem feedback.

## Register

Contrato visual:

- `title`: `Register`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Register`
- `header .header-right > a`: `Back`, com destino `/`
- `main > div.container`
- `section#register-area`
- `form#register-form`

IDs e validacao:

- `#username-email`
  - `type="text"`
  - `name="username"`
  - `placeholder="Username"`
  - `autocomplete="username"`
  - `required`
  - `pattern="^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$"`
  - `minlength="1"`
  - `maxlength="32"`
- `#password-register`
  - `type="password"`
  - `name="password"`
  - `placeholder="Password"`
  - `autocomplete="new-password"`
  - `required`
  - `pattern="^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,64}$"`
  - `minlength="8"`
  - `maxlength="64"`
- `#register-button`, texto `Register`
- `#register-feedback`, `aria-live="polite"`

Fluxo:

- O submit chama `POST /api/register` uma unica vez.
- `username` e normalizado e `password` preserva o valor digitado.
- `409`: `User already exists.`
- `400`: `Username or password is invalid.`
- Outros erros: `data.error || 'Unable to create your account.'`
- Sucesso: `Registration complete! Redirecting...`
- O atraso visual permanece em 600 ms.
- A navegacao para `/account` usa o React Router.

## Account

Contrato visual:

- `title`: `Account`
- CSS global: `/static/assets/css/style.css`
- `header > h1`: `Account`
- `#logout-button`, texto `Logout`
- Itens de navegacao: `Inventory`, `Market`, `Settings`

Fluxo:

- A pagina pode renderizar seu esqueleto sem autenticacao.
- O logout chama `DELETE /api/logout`.
- Ao terminar, o React Router navega para `/` sem recarregar o documento.

## CSS global preservado

O CSS global fica em `src/public/assets/css/style.css`. O markup React preserva
os seletores `header`, `header h1`, `.header-right`, `div.container`,
`div.container input`, `div.container button`, `section`, `nav ul` e `nav ul li`.
