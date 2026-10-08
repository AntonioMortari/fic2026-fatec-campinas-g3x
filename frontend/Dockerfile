# syntax=docker/dockerfile:1

# --- dev: usado pelo docker compose da raiz, com o código montado como volume
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
