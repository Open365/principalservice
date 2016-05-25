FROM docker-registry.eyeosbcn.com/alpine6-node-base

ENV WHATAMI principalService

ENV InstallationDir /var/service/

WORKDIR ${InstallationDir}

CMD eyeos-run-server --serf /var/service/src/eyeos-principalService.js

COPY . ${InstallationDir}

RUN apk update && apk add --no-cache curl make gcc g++ git python && \
    npm install --production && \
    npm cache clean && \
    apk del curl make gcc g++ git python && \
    rm -r /etc/ssl /var/cache/apk/* /tmp/*
