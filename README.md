## Live URLs
- API: https://typescript-crud-api.onrender.com
- API Docs: https://typescript-crud-api.onrender.com/api-docs
- Frontend: https://angular-auth-boilerplate-rr7y.onrender.com


# TypeScript CRUD API

A fully typed REST API built with Node.js, Express, TypeScript, Sequelize, and MySQL.

## Features
- Full CRUD operations for user management
- TypeScript interfaces and enums for type safety
- Joi validation for request bodies
- bcrypt password hashing
- JWT-ready architecture
- Global error handling middleware

## Prerequisites
- Node.js v18 or higher
- MySQL database
- Postman or EchoAPI for testing

## Project Structure
typescript-crud-api/
├── config.json          # Database credentials
├── tsconfig.json        # TypeScript compiler settings
├── package.json
└── src/
├── server.ts        # Entry point
├── _helpers/
│   ├── db.ts        # MySQL + Sequelize setup
│   └── role.ts      # Role enum
├── _middleware/
│   ├── errorHandler.ts      # Global error handler
│   └── validateRequest.ts   # Joi validation wrapper
└── users/
├── user.model.ts        # Sequelize User model
├── user.service.ts      # Business logic
└── users.controller.ts  # Route handlers
## Setup Instructions

### 1. Clone the repository
git clone https://github.com/YOURUSERNAME/typescript-crud-api.git
cd typescript-crud-api
### 2. Install dependencies
npm install
### 3. Configure database
Edit `config.json` with your database credentials:
```json
{
  "database": {
    "host": "your-host",
    "port": 3306,
    "user": "your-username",
    "password": "your-password",
    "database": "your-database"
  },
  "jwtSecret": "your-secret-key"
}
```

### 4. Start the server
npm run start:dev
You should see:
✅ Database initialized and models synced
✅ Server running on http://localhost:4000
## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | Get all users |
| GET | /users/:id | Get user by ID |
| POST | /users | Create new user |
| PUT | /users/:id | Update user |
| DELETE | /users/:id | Delete user |

## Testing the API

### Create a User (POST /users)
```json
{
  "title": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "role": "User"
}
```
Expected response:
```json
{ "message": "User created" }
```

### Get All Users (GET /users)
GET http://localhost:4000/users
Expected response: Array of user objects (passwordHash excluded)

### Get User by ID (GET /users/1)
GET http://localhost:4000/users/1
Expected response: Single user object

### Update User (PUT /users/1)
```json
{
  "firstName": "Jane",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```
Expected response:
```json
{ "message": "User updated" }
```

### Delete User (DELETE /users/1)
DELETE http://localhost:4000/users/1
Expected response:
```json
{ "message": "User deleted" }
```

### Validation Error Example
Send a POST request with missing fields:
```json
{ "firstName": "Bob" }
```
Expected response (400):
```json
{ "message": "Validation error: email is required, password is required..." }
```

## Scripts
- `npm run start:dev` — Run with auto-reload during development
- `npm run build` — Compile TypeScript to JavaScript
- `npm start` — Run compiled JavaScript

## Author
Earl Zedric Estrada