#############################################################
# DOCKERFILE FOR STATIC-CACHE
#############################################################
# DEPENDENCIES
# * NodeJS (provided)
# * Apache Camel Central (provided)
# * RabbitMQ (provided)
#############################################################
# BUILD FLOW
# 3. Copy the service to the docker at /var/service
# 4. Run the default installatoin
# 5. Add the docker-startup.sh file which knows how to start
#    the service
#############################################################

FROM docker-registry.eyeosbcn.com/eyeos-fedora21-node-base

ENV InstallationDir /var/service/
ENV WHATAMI principalService

WORKDIR ${InstallationDir}

CMD eyeos-run-server --serf /var/service/src/eyeos-principalService.js

RUN mkdir -p ${InstallationDir}/src/ && touch ${InstallationDir}src/principalService-installed.js

COPY . ${InstallationDir}

RUN npm install --verbose && \
    npm cache clean
