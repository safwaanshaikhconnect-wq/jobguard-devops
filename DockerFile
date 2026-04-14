#Stage1
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .
RUN npm run build

#Stage2
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80