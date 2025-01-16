# base image
FROM node:22-alpine

# fix timezone
RUN apk add --no-cache tzdata
ENV TZ="America/Sao_Paulo"

# copy project files
COPY package.json /app/
COPY server.js /app/
COPY .env /app/
COPY allowed_ips.json /app/
COPY src /app/src/

# make log folder
RUN mkdir -p /app/logs

# cd
WORKDIR /app

# node packages
RUN npm install --verbose

# START APPLICATION
CMD ["npm", "run", "start"]