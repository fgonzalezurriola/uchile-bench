FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2
ARG UV_VERSION=0.7.13

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates curl dnsutils git iproute2 netcat-openbsd \
  python3 python3-pip python3-venv tcpdump time \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}" \
  && python3 -m pip install --break-system-packages "uv==${UV_VERSION}" \
  && uv venv /opt/venv \
  && uv pip install --python /opt/venv/bin/python "dnslib==0.9.26" \
  && printf '#!/bin/sh\nexec /opt/venv/bin/python "$@"\n' >/usr/local/bin/python \
  && printf '#!/bin/sh\nexec /opt/venv/bin/python3 "$@"\n' >/usr/local/bin/python3 \
  && chmod +x /usr/local/bin/python /usr/local/bin/python3

ENV HOME=/agent-home
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
WORKDIR /workspace

RUN python3 -c "import dnslib" \
  && curl --version \
  && dig -v \
  && nc -h 2>&1 | head -1 \
  && pi --version
