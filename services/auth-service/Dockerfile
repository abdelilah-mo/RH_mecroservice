FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/auth-service ./services/auth-service

EXPOSE 3001

CMD ["node", "services/auth-service/server.js"]