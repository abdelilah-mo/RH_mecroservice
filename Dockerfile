FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY api.js ./
COPY public ./public

EXPOSE 3000

CMD ["node", "api.js"]
