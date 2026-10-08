# syntax=docker/dockerfile:1

FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3333
CMD ["npm", "run", "dev"]

FROM dev AS build
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3333
CMD ["node", "dist/server.js"]
