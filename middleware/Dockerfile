FROM node:20-alpine

WORKDIR /app

# Copy and install shared package dependencies first
COPY shared/package*.json ../shared/
RUN cd ../shared && npm ci

# Copy shared source and build it
COPY shared/ ../shared/
RUN cd ../shared && npm run build

# Copy and build frontend
COPY web-frontend/package*.json ../web-frontend/
RUN cd ../web-frontend && npm ci
COPY web-frontend/ ../web-frontend/
RUN cd ../web-frontend && npm run build

# Copy middleware package files and install (this will link to ../shared)
COPY middleware/package*.json middleware/package-lock.json ./
RUN npm ci

# Copy middleware source
COPY middleware/ .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
