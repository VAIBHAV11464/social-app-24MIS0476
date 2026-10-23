# Social App v2 - Add Post, Like
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY public ./public
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
