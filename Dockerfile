# —— Build ——
FROM node:22.1.0-bullseye-slim AS builder
WORKDIR /api-nonna
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# —— Production (imagen mínima) ——
FROM node:22.1.0-bullseye-slim
WORKDIR /api-nonna
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --ignore-optional \
    && yarn cache clean
COPY --from=builder /api-nonna/dist ./dist
# Firebase: montar credenciales en runtime (secret/volumen), no copiar al layer de la imagen.
EXPOSE 3000
CMD ["node", "dist/main.js"]
