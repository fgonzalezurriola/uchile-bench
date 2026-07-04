#!/bin/sh
set -eu

: "${DISPLAY:=:99}"
: "${XVFB_SCREEN:=1280x720x24}"
export DISPLAY

Xvfb "$DISPLAY" -screen 0 "$XVFB_SCREEN" -nolisten tcp >/tmp/xvfb.log 2>&1 &
xvfb_pid=$!
trap 'kill "$xvfb_pid" 2>/dev/null || true' EXIT INT TERM

attempt=0
until xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 50 ]; then
    cat /tmp/xvfb.log >&2
    exit 1
  fi
  sleep 0.1
done

exec "$@"
