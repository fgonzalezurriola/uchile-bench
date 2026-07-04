FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG PI_VERSION=0.80.2
ARG UV_VERSION=0.7.13

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential ca-certificates git libegl1 libgl1 libglu1-mesa \
  libgl1-mesa-dri libosmesa6 libx11-6 libxext6 libxinerama1 libxrandr2 \
  mesa-utils python3 python3-dev python3-pip python3-venv unzip x11-utils xvfb \
  && rm -rf /var/lib/apt/lists/*

RUN npm install --global "@earendil-works/pi-coding-agent@${PI_VERSION}" \
  && python3 -m pip install --break-system-packages "uv==${UV_VERSION}" \
  && uv venv /opt/venv \
  && uv pip install --python /opt/venv/bin/python \
    "numpy==1.26.4" \
    "Pillow==10.4.0" \
    "pyglet==2.0.15" \
    "PyOpenGL==3.1.7" \
    "pymunk==6.8.1" \
    "scipy==1.13.1" \
    "shapely==2.0.4" \
    "trimesh==4.4.1"

COPY docker/cc3501-entrypoint.sh /usr/local/bin/cc3501-entrypoint
RUN chmod 0755 /usr/local/bin/cc3501-entrypoint

ENV HOME=/agent-home \
    PATH=/opt/venv/bin:${PATH} \
    DISPLAY=:99 \
    LIBGL_ALWAYS_SOFTWARE=1 \
    MESA_LOADER_DRIVER_OVERRIDE=llvmpipe \
    PYTHONUNBUFFERED=1 \
    XVFB_SCREEN=1280x720x24

WORKDIR /workspace
ENTRYPOINT ["/usr/local/bin/cc3501-entrypoint"]

RUN python3 --version \
  && uv --version \
  && python3 -c "import OpenGL, PIL, numpy, pyglet, pymunk, scipy, shapely, trimesh" \
  && pi --version
