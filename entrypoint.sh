#!/bin/sh
set -e

for var in JELLYFIN_URL JELLYFIN_API_KEY OVERSEERR_URL OVERSEERR_API_KEY; do
  eval "val=\${$var}"
  if [ -z "$val" ]; then
    echo "ERROR: Required environment variable $var is not set." >&2
    exit 1
  fi
done

envsubst '${JELLYFIN_URL} ${JELLYFIN_API_KEY} ${OVERSEERR_URL} ${OVERSEERR_API_KEY}' \
  < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

envsubst '${JELLYFIN_URL} ${OVERSEERR_URL}' \
  < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
