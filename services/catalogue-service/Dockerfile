FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/catalogue-service ./services/catalogue-service

EXPOSE 3006

CMD ["node", "services/catalogue-service/server.js"]