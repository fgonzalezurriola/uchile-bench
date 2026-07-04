FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2
ARG PLAY_COMMIT=4ab35fa8ffbeb3a074af3c59e4accba9b762234f

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates git libfontconfig1 libgdk-pixbuf-2.0-0 libglib2.0-0 \
  libgtk2.0-0 libjpeg62-turbo libpangocairo-1.0-0 libpng16-16 \
  libsqlite3-dev racket sqlite3 \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}" \
  && raco pkg install --installation --auto --batch \
    "https://github.com/pleiad/play.git#${PLAY_COMMIT}"

ENV HOME=/agent-home LC_ALL=C.UTF-8 LANG=C.UTF-8
WORKDIR /workspace

RUN printf '#lang play\n(displayln "play-ok")\n' >/tmp/play-smoke.rkt \
  && racket /tmp/play-smoke.rkt \
  && rm /tmp/play-smoke.rkt \
  && pi --version
