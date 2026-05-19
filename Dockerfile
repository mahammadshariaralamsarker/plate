# Build Stage
FROM node:20 AS builder
WORKDIR /app

# Copy package files first for dependency caching
COPY package.json package-lock.json ./
RUN npm ci 

# Copy Prisma files & source
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY . .

# Copy .env temporarily for Prisma generation
COPY .env.production .env

# Generate Prisma client (reads DATABASE_URL from .env)
RUN npx prisma generate && ls -la node_modules/.prisma/client/ || echo "Prisma client not found"

# Build NestJS app
RUN npm run build

# Remove .env to keep image clean
RUN rm -f .env

# Production Stage
FROM node:20 AS production
WORKDIR /app

# Copy build output & node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy the actual generated Prisma client to the proper location
RUN rm -rf node_modules/.prisma/client && \
    cp -r prisma/generated node_modules/.prisma/client

# Environment
ENV NODE_ENV=production
EXPOSE 3001

# Start the app
CMD ["npm", "run", "start:prod"]