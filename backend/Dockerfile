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
ENV UPLOADS_DIR=/uploads
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed-content ./seed-content
RUN mkdir -p /uploads && chown node:node /uploads
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# SEED_CONTENT=true publishes the ONG's first news and photos once (it does nothing if the site already has any).
CMD ["sh", "-c", "npm run db:migrate:prod && if [ \"$SEED_CONTENT\" = \"true\" ]; then npm run db:seed:content:prod; fi && node dist/server.js"]
