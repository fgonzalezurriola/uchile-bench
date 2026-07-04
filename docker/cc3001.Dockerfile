FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2
ARG UV_VERSION=0.7.13

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    git \
    graphviz \
    python3 \
    python3-pip \
    python3-venv \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}" \
  && python3 -m pip install --break-system-packages "uv==${UV_VERSION}" \
  && uv venv /opt/venv \
  && uv pip install --python /opt/venv/bin/python \
    "aed-utilities==0.5.8" \
    "graphviz==0.20.3" \
    "ipython==8.26.0" \
    "matplotlib==3.8.4" \
    "numpy==1.26.4"

ENV HOME=/agent-home \
    PATH=/opt/venv/bin:${PATH} \
    MPLBACKEND=Agg \
    PYTHONUNBUFFERED=1

WORKDIR /workspace

RUN python3 --version \
  && uv --version \
  && python3 -c "import aed_utilities, matplotlib, numpy" \
  && pi --version
