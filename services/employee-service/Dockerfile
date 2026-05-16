FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/employee-service ./services/employee-service

EXPOSE 3005

CMD ["node", "services/employee-service/server.js"]