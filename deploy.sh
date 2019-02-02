#!/bin/bash
if [ $# -ne 0 ]; then
    parcel build src/index.js && \
    git add src/index.js &&\
    git commit -m "$1" &&\
    git push
else
    echo "Usage: ./deploy.sh [your commit message]";
    exit
fi