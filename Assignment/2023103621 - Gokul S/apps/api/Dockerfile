FROM node:22-bookworm-slim

WORKDIR /app

ARG DATABASE_URL=postgresql://pulse:build-only@localhost:5432/pulse?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && npm start"]