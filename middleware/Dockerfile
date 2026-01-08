FROM node:20-alpine

WORKDIR /app

# Copy and install shared package dependencies first
COPY shared/package*.json ../shared/
COPY shared/.npmrc ../shared/
RUN --mount=type=secret,id=FOUNDRY_TOKEN \
    FOUNDRY_TOKEN="$(cat /run/secrets/FOUNDRY_TOKEN)" npm ci --prefix ../shared

# Copy shared source and build it BEFORE web-frontend install
COPY shared/ ../shared/
RUN cd ../shared && npm run build

# Copy and install frontend (this will link to built shared package)
COPY web-frontend/package*.json ../web-frontend/
COPY web-frontend/package-lock.json ../web-frontend/ 2>/dev/null || true
RUN cd ../web-frontend && npm ci

# Copy and build frontend
COPY web-frontend/ ../web-frontend/
RUN cd ../web-frontend && npm run build

# Copy middleware package files and install (this will link to ../shared)
COPY middleware/package*.json middleware/package-lock.json ./
COPY middleware/.npmrc ./
RUN --mount=type=secret,id=FOUNDRY_TOKEN \
    FOUNDRY_TOKEN="$(cat /run/secrets/FOUNDRY_TOKEN)" npm ci

# Copy middleware source
COPY middleware/ .

# Build TypeScript
RUN npm run build

EXPOSE 3000


CMD ["npm", "start"]
