#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Waiting for database..."

  for i in $(seq 1 30); do
    if php bin/console doctrine:query:sql "SELECT 1" >/dev/null 2>&1; then
      echo "Database is ready."
      break
    fi

    if [ "$i" -eq 30 ]; then
      echo "Database is not reachable yet; starting Apache anyway."
    else
      sleep 2
    fi
  done

  php bin/console doctrine:migrations:migrate --no-interaction || true
fi

exec apache2-foreground
