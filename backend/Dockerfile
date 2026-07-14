FROM php:8.4-apache

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip \
    && docker-php-ext-install intl pdo pdo_mysql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV APP_ENV=prod \
    APP_DEBUG=0 \
    COMPOSER_MAX_PARALLEL_HTTP=1 \
    COMPOSER_PROCESS_TIMEOUT=2000

WORKDIR /var/www/html

COPY . .

RUN set -eux; \
    composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    || composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    || composer install --no-dev --prefer-source --no-interaction --optimize-autoloader

RUN mkdir -p public/uploads/documents \
    && chown -R www-data:www-data public/uploads \
    && chmod -R 775 public/uploads

RUN sed -i 's/\r$//' docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh

RUN a2enmod rewrite

RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

RUN printf '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
    SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1\n\
    FallbackResource /index.php\n\
</Directory>\n' > /etc/apache2/conf-available/symfony.conf \
    && a2enconf symfony

EXPOSE 80

CMD ["./docker-entrypoint.sh"]
