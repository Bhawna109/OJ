FROM node:24-alpine
RUN apk update && apk add --no-cache g++ python3 openjdk21-jdk
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]