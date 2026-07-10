# Guide de deploiement local - Projet SIRH

Ce guide explique comment lancer le projet SIRH en local avec Docker.

Le projet contient :

- un frontend React ;
- un backend Symfony ;
- une base de donnees MariaDB ;
- phpMyAdmin pour consulter la base.

## 1. Prerequis

Avant de lancer le projet, installer :

- Docker Desktop ;
- Git ;
- un navigateur web.

Verifier que Docker Desktop est bien ouvert avant de lancer les commandes.

## 2. Recuperer le projet

Cloner le depot GitHub :

```bash
git clone https://github.com/Manel28/sirh.git
cd sirh
```

Si le projet est deja telecharge, ouvrir un terminal a la racine du projet, dans le dossier qui contient :

```txt
docker-compose.yml
backend/
frontend/
```

## 3. Lancer l'application

Depuis la racine du projet :

```bash
docker compose up --build
```

Cette commande construit et lance les conteneurs :

- `sirh_frontend` : interface React ;
- `sirh_backend` : API Symfony ;
- `sirh_database` : base MariaDB ;
- `sirh_phpmyadmin` : interface d'administration de la base.

## 4. Acceder a l'application

Une fois les conteneurs lances :

```txt
Application React : http://127.0.0.1:5173
Backend Symfony   : http://127.0.0.1:8001
phpMyAdmin        : http://127.0.0.1:8080
```

L'adresse principale a ouvrir est :

```txt
http://127.0.0.1:5173
```

Remarque : l'adresse `http://127.0.0.1:8001/api` n'est pas une page d'accueil. Elle peut afficher une erreur si aucune route exacte `/api` n'existe. Le test principal se fait depuis le frontend React.

## 5. Initialiser la base de donnees

Si les tables ne sont pas encore creees, lancer les migrations :

```bash
docker exec -it sirh_backend php bin/console doctrine:migrations:migrate
```

Valider avec `yes` si Symfony demande confirmation.

## 6. Creer un compte administrateur

Pour creer un premier compte administrateur RH :

```bash
docker exec -it sirh_backend php bin/console app:create-user
```

Renseigner par exemple :

```txt
Email    : admin.rh@sirh.com
Password : Admin123!
Role     : ROLE_ADMIN
```

Ensuite, se connecter sur :

```txt
http://127.0.0.1:5173
```

avec :

```txt
admin.rh@sirh.com
Admin123!
```

## 7. Fonctionnalites a tester

Apres connexion administrateur, tester :

- consultation du tableau de bord ;
- creation et gestion des collaborateurs ;
- creation d'une demande de conge ;
- validation ou refus d'une demande de conge ;
- affichage du calendrier ;
- upload d'un document PDF ;
- consultation des notifications.

## 8. phpMyAdmin

phpMyAdmin est disponible ici :

```txt
http://127.0.0.1:8080
```

Informations de connexion :

```txt
Serveur : database
User    : root
Password: laisser vide
Base    : si_rh
```

## 9. Arreter le projet

Dans le terminal ou Docker est lance :

```bash
Ctrl + C
```

Puis, si besoin :

```bash
docker compose down
```

## 10. Probleme courant

### Le site `127.0.0.1:5173` ne repond pas

Verifier que Docker Desktop est ouvert et que les conteneurs sont bien lances.

### Le backend `127.0.0.1:8001` ne repond pas

Verifier les logs du backend :

```bash
docker logs sirh_backend
```

### La connexion echoue

Verifier que :

- les migrations ont ete executees ;
- un utilisateur administrateur a ete cree ;
- l'email et le mot de passe saisis correspondent au compte cree.

### L'upload PDF echoue

Le Dockerfile prepare normalement le dossier :

```txt
backend/public/uploads/documents
```

avec les droits necessaires pour Apache/Symfony.

Si besoin, reconstruire les conteneurs :

```bash
docker compose up --build
```

## 11. Architecture rapide

Le frontend React communique avec le backend Symfony via une API REST.

En local, l'URL API utilisee est :

```txt
http://127.0.0.1:8001/api
```

Le backend Symfony communique avec la base MariaDB via Doctrine ORM.

Docker Compose orchestre tous les services pour permettre au projet de fonctionner localement sans configuration manuelle complexe.
