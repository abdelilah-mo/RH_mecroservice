FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/reclamation-service ./services/reclamation-service

EXPOSE 3008

CMD ["node", "services/reclamation-service/server.js"]