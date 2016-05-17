#!/bin/bash
set -e
set -u
EYEOS_PRINCIPALSERVICE_PRINCIPALSQUEUE_HOSTS=localhost:5672 EYEOS_PRINCIPALSERVICE_MONGO_HOST=localhost node src/eyeos-principalService.js &