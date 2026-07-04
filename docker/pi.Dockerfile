FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    python3 \
    python3-matplotlib \
    python3-numpy \
    python3-pip \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN bun install -g --ignore-scripts @earendil-works/pi-coding-agent@0.80.2
RUN ln -s /root/.bun/bin/bun /usr/local/bin/bun \
  && ln -s /root/.bun/bin/bunx /usr/local/bin/bunx \
  && ln -s /root/.bun/bin/pi /usr/local/bin/pi \
  && bun --version \
  && command -v pi

WORKDIR /workspace

# HOME is overridden at runtime to /agent-home
ENV HOME=/agent-home
