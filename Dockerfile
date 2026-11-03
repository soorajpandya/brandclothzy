# BrandClothzy API — container for Google Cloud Run.
# Build context = repository root, because the server imports ../shared/pricing.js and
# ../src/data/products.js (the same catalog and pricing the storefront uses).
FROM node:20-slim

ENV NODE_ENV=production
WORKDIR /app

# The shared ES modules need "type": "module" from a package.json above them.
RUN echo '{"type":"module","private":true}' > /app/package.json

COPY server/package.json server/package-lock.json /app/server/
RUN cd /app/server && npm ci --omit=dev && npm cache clean --force

COPY shared/pricing.js /app/shared/pricing.js
COPY src/data/products.js /app/src/data/products.js
COPY server/ /app/server/

# Never ship local secrets (also excluded by .dockerignore / .gcloudignore).
RUN rm -f /app/server/.env && rm -rf /app/server/test

USER node
WORKDIR /app/server
# Cloud Run provides $PORT (8080); the server reads it.
CMD ["node", "index.js"]
