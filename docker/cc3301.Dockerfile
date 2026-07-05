FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash binutils build-essential ca-certificates coreutils file gdb \
  gcc-riscv64-unknown-elf git less make picolibc-riscv64-unknown-elf \
  qemu-user strace time valgrind zip \
  && mkdir -p /opt/riscv/bin /opt/riscv/riscv64-unknown-elf/bin \
  && for tool in addr2line ar as c++ c++filt cpp elfedit gcc-ar \
    gcc-nm gcc-ranlib gcov gcov-dump gcov-tool gdb gprof ld ld.bfd \
    lto-dump nm objcopy objdump ranlib readelf size strings strip; do \
    ln -sf /usr/bin/riscv64-unknown-elf-$tool \
      /opt/riscv/bin/riscv64-unknown-elf-$tool; \
  done \
  && for tool in ar as ld ld.bfd nm objcopy objdump ranlib readelf strip; do \
    ln -sf /usr/bin/riscv64-unknown-elf-$tool \
      /opt/riscv/riscv64-unknown-elf/bin/$tool; \
  done \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/riscv/support \
  && cp /usr/lib/picolibc/riscv64-unknown-elf/lib/release/picolibc.ld /opt/riscv/support/picolibc-qemu.ld \
  && cat > /opt/riscv/support/qemu.ld <<'EOF'
ENTRY(_start)

MEMORY
{
    ram (rwx) : ORIGIN = 0x10000000, LENGTH = 0x100000
}

SECTIONS
{
    .text : {
        KEEP(*(.text.startup))
        KEEP(*(.init))
        KEEP(*(.init.*))
        *(.text .text.*)
        *(.rodata .rodata.*)
        *(.srodata .srodata.*)
    } >ram AT>ram

    . = 0x20000000;
    __global_pointer$ = . + 0x800;

    .data : {
        *(.data .data.*)
        *(.sdata .sdata.*)
    } >ram AT>ram

    .bss : {
        *(.bss .bss.*)
        *(.sbss .sbss.*)
        *(COMMON)
        . = ALIGN(8);
    } >ram AT>ram

    .stack (NOLOAD) : {
        . = . + 0x80000;
    } >ram AT>ram

    . = ALIGN(8);
    __bss_end = .;
    __end = .;
    _end = .;
    __stack = .;
}
EOF

RUN cat > /opt/riscv/support/crt0.s <<'EOF'
    .section .text.startup, "ax"
    .globl _start
_start:
    la sp, __stack
    la gp, __global_pointer$
    li a0, 0
    li a1, 0
    call main
    li a7, 93
    ecall
    j .
EOF

RUN cat > /opt/riscv/support/syscall.c <<'EOF'
#include <stddef.h>
#include <unistd.h>

ssize_t write(int fd, const void *buf, size_t count) {
    register long a0 __asm__("a0") = fd;
    register const void *a1 __asm__("a1") = buf;
    register size_t a2 __asm__("a2") = count;
    register long a7 __asm__("a7") = 64;
    __asm__ volatile ("ecall" : "+r"(a0) : "r"(a1), "r"(a2), "r"(a7) : "memory");
    return a0;
}

void _exit(int status) {
    register long a0 __asm__("a0") = status;
    register long a7 __asm__("a7") = 93;
    __asm__ volatile ("ecall" : : "r"(a0), "r"(a7) : "memory");
    for (;;) {}
}
EOF

RUN cat > /opt/riscv/support/stdio_init.c <<'EOF'
#include <stdio.h>
#include <unistd.h>

static int my_put(char c, FILE *f) {
    char ch = c;
    (void)!write(fileno(f), &ch, 1);
    return c;
}

static int my_get(FILE *f) {
    (void)f;
    return -1;
}

static int my_flush(FILE *f) {
    (void)f;
    return 0;
}

static FILE __stdin_FILE  = { 0, 0x01, my_put, my_get, my_flush };
static FILE __stdout_FILE = { 0, 0x02, my_put, my_get, my_flush };
static FILE __stderr_FILE = { 0, 0x02, my_put, my_get, my_flush };

FILE *__stdio = &__stdin_FILE;
FILE * const stdin  = &__stdin_FILE;
FILE * const stdout = &__stdout_FILE;
FILE * const stderr = &__stderr_FILE;

int fileno(FILE *f) {
    if (f == &__stdin_FILE) return 0;
    if (f == &__stdout_FILE) return 1;
    if (f == &__stderr_FILE) return 2;
    return -1;
}
EOF

RUN cat > /opt/riscv/bin/riscv64-unknown-elf-gcc <<'EOF'
#!/bin/sh
set -eu

for arg in "$@"; do
  case "$arg" in
    -c|-S|-E)
      exec /usr/bin/riscv64-unknown-elf-gcc --specs=picolibc.specs "$@"
      ;;
  esac
done

exec /usr/bin/riscv64-unknown-elf-gcc \
  --specs=picolibc.specs \
  -nostartfiles \
  -T /opt/riscv/support/qemu.ld \
  /opt/riscv/support/crt0.s \
  "$@" \
  /opt/riscv/support/stdio_init.c \
  /opt/riscv/support/syscall.c \
  -L /usr/lib/picolibc/riscv64-unknown-elf/lib/release/rv32im/ilp32 \
  -Wl,--start-group -lc -Wl,--end-group
EOF
RUN chmod 0755 /opt/riscv/bin/riscv64-unknown-elf-gcc \
  && ln -sf /opt/riscv/bin/riscv64-unknown-elf-gcc /opt/riscv/bin/riscv64-unknown-elf-g++

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}"

ENV HOME=/agent-home LC_ALL=C.UTF-8 LANG=C.UTF-8
WORKDIR /workspace

RUN gcc --version \
  && riscv64-unknown-elf-gcc --version \
  && qemu-riscv32 --version \
  && pi --version
