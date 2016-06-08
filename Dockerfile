FROM docker-registry.eyeosbcn.com/alpine6-node-base

ENV WHATAMI principalService

ENV InstallationDir /var/service/

WORKDIR ${InstallationDir}

CMD eyeos-run-server --serf /var/service/src/eyeos-principalService.js

COPY . ${InstallationDir}

RUN apk update && \
    /scripts-base/buildDependencies.sh --production --install && \
    npm install --production && \
    npm cache clean && \
    /scripts-base/buildDependencies.sh --production --purgue && \
    rm -r /etc/ssl /var/cache/apk/* /tmp/*
