# syntax=docker/dockerfile:1

# --- dev: usado pelo docker compose da raiz, com o código montado como volume
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3333
CMD ["npm", "run", "dev"]

# --- build: compila o TypeScript
FROM dev AS build
RUN npm run build && npm prune --omit=dev

# --- producao: só o JavaScript compilado e as dependências de execução
FROM node:22-alpine AS producao
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3333
CMD ["node", "dist/server.js"]
