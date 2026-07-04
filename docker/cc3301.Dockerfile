FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash binutils build-essential ca-certificates coreutils file gdb \
  gcc-riscv64-unknown-elf git less make qemu-user strace time valgrind \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}"

ENV HOME=/agent-home LC_ALL=C.UTF-8 LANG=C.UTF-8
WORKDIR /workspace

RUN gcc --version \
  && riscv64-unknown-elf-gcc --version \
  && qemu-riscv32 --version \
  && pi --version
