ARG NODE_VERSION=21

FROM node:${NODE_VERSION}-alpine

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 4200

CMD ["npm", "run", "dev"]