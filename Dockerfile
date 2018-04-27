FROM node:alpine

RUN apk add --no-cache make gcc g++ python git

COPY . /src/dim-rpc

RUN cd /src/dim-rpc \
    && npm install -g forever \
    && npm install

WORKDIR /src/dim-rpc
ENTRYPOINT ["forever","./server.js"]

EXPOSE 8080
