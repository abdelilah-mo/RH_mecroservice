FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/position-service ./services/position-service

EXPOSE 3004

CMD ["node", "services/position-service/server.js"]