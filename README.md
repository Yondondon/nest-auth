## Description

Basic auth via JWT on NestJS + TypeScript + PostgreSQL

### To start app you should do:

- run `npm i`
- fill `.env`; In case of using local db — set `DB_NAME` to `db`, other db params — as you wish
- run `docker compose up -d --build`

Use `curl --location 'localhost:3000/auth/sign-up' \
--header 'Content-Type: application/json' \
--data '{
    "username": "user1",
    "password": "pass"
}'` to create a user. Don't forget to change creds and port. 