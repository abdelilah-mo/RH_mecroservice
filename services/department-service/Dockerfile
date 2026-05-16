FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/department-service ./services/department-service

EXPOSE 3003

CMD ["node", "services/department-service/server.js"]