FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-factor 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000
RUN npm config set registry https://registry.npmmirror.com

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 4005
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
