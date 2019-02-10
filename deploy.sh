#!/bin/bash
if [ $# -ne 0 ]; then
    parcel build src/index.js && \
    git add . &&\
    git commit -m "$1" &&\
    git push &&\
    git archive HEAD -o extension.zip
else
    echo "Usage: ./deploy.sh [your commit message]";
    exit
fi