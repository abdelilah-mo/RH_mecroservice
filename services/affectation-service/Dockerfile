FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/affectation-service ./services/affectation-service

EXPOSE 3007

CMD ["node", "services/affectation-service/server.js"]