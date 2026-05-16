FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build:frontend

FROM node:20-slim AS runtime

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY config ./config
COPY db ./db
COPY src/app.js src/index.js src/routes.js ./src/
COPY src/db ./src/db
COPY src/models ./src/models
COPY src/services ./src/services
COPY src/shared/css ./src/shared/css
COPY src/frontend/index.html ./src/frontend/index.html
COPY --from=builder /app/src/public/assets/build ./src/public/assets/build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
