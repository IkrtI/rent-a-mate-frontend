FROM node:24-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ARG BACKEND_URL=http://192.168.1.161:3002/api/v1
ARG NEXT_PUBLIC_APP_URL=https://test-host.invalid
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV SESSION_COOKIE_SECURE=true
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
