#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

docker build -t ff-favicon:latest .
docker run -it -p 4000:4000 ff-favicon:latest
