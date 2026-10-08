# mamabear-backend

## Description

Backend API for Mamabear Frontend [Link repo FE di sini]().

## Getting Started

### Requirements

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 18 or higher (20+ recommended) | Use an LTS release |
| npm | Bundled with Node.js |  |
| Nest CLI | Latest (optional) | `npm i -g @nestjs/cli` |
| Git | Any recent version | For cloning the repository |
| PostgreSQL | 17 or higher | Requires the `pgvector` extension |

| Account | Website | Usage |
| --- | --- | --- |
| Rajaongkir | https://rajaongkir.com/ | Calculate shipment cost |
| Midtrans | https://midtrans.com/ | Payment gateway |
| Cloudinary | https://cloudinary.com/ | Image assets cloud storage |
| OpenRouter | https://openrouter.ai/ | AI models |

- Bruno account?

### Setup

1. **Clone the repository**

```bash
   git clone https://github.com/your-username/mamabear-backend.git
   cd mamabear-backend
```


2. **Install dependencies**

```bash
$ npm install
```

3. **Configure environment variables**

    Copy the example  `env.example` file:

```bash
   cp .env.example .env
```

Update the values of `.env` file.


**Never commit `.env` or any secrets.**

4. **Set up the database with Prisma ORM**

    On a new empty database:
- Migrate:
```bash
   npx prisma migrate dev
```

- Seeding:
```bash
   npx prisma db seed
```

In case you use a different AI model for the image embedding:
- Modify the migration SQL script in `prisma/migrations/20260516151339_embedding_for_related_products` folder. Match the `vector` values to the model's output dimension.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Once running, the project is running locally on the designated port declared in `.env` or on port 3000 by default.
```
http://localhost:1234

OR

http://localhost:1234
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Endpoints

Check out the `/api` route of this project.

## Project Structure
```
/prisma
├───helper
└───migrations
/src
├───activity-log
│   └───dto
├───addresses
│   └───dto
├───auth
│   ├───decorators
│   ├───dto
│   ├───entities
│   └───guard
├───cart
│   └───dto
├───category
│   ├───dto
│   └───entities
├───chat
│   ├───dto
│   └───utils
├───cloudinary
├───common
│   ├───decorators
│   ├───dto
│   │   ├───request
│   │   └───response
│   ├───filters
│   ├───guards
│   ├───interceptors
│   ├───logger
│   ├───services
│   └───utils
├───discounts
│   ├───dto
│   └───entities
├───embeddings
├───generated
│   └───prisma
│       └───runtime
├───health
│   └───dto
├───highlights
│   ├───dto
│   └───entities
├───options
├───order
│   ├───dto
│   └───entities
├───payment
│   └───dto
├───prisma
├───product-utils
├───products
│   ├───dto
│   └───entities
├───promo-shipment
│   ├───dto
│   └───entities
├───reports
│   ├───dto
│   └───entities
├───reviews
│   ├───dto
│   └───entities
├───scheduler
├───search
│   ├───dto
│   └───entities
├───settings
│   └───dto
├───shipping
│   └───dto
├───types
├───upload
│   ├───dto
│   └───entities
├───users
│   ├───dto
│   └───entities
└───variant
    ├───dto
    └───entities
```