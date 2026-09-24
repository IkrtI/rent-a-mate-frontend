FROM node:24-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG BACKEND_URL=http://192.168.1.161:3002/api/v1
ENV BACKEND_URL=$BACKEND_URL
ENV SESSION_COOKIE_SECURE=true
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
