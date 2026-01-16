# OMS Backend - Employee Management System

A Node.js/Express backend API for managing employees with authentication, profile management, and file uploads to AWS S3.


## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **AWS Account** (for S3 file storage)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd oms/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   
   ```env
   # Server Configuration
   PORT=5000
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   DB_NAME=oms_database
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_S3_BUCKET=your_s3_bucket_name
   AWS_REGION=your_aws_region
   ```

   **Important:** Replace all placeholder values with your actual credentials.

4. **Create PostgreSQL database**
   ```bash
   createdb oms_database
   ```
   Or use your preferred PostgreSQL client to create the database.

5. **Run database migrations**
   ```bash
   npm run migrate
   ```
   This will create all necessary tables in your database.

6. **Seed initial data (Optional)**
   ```bash
   npm run seed
   ```
   This will create an admin user and sample employees for testing.

## 🏃 Running the Application

### Development Mode

Run the application in development mode with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the PORT specified in your `.env` file).


## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
├── package.json
└── README.md
```

### Migrations

```bash
# Run all pending migrations
npm run migrate

# Undo all migrations
npm run migrate:undo
```

### Seeders

```bash
# Run all seeders
npm run seed

# Undo all seeders
npm run seed:undo
```

## 🧪 Testing

After seeding the database, you can use these default credentials:

- **Admin User**: Check `src/seeders/adminSeeder.js` for admin credentials
- **Employee Users**: Check `src/seeders/employeeSeeder.js` for sample employees


## 📦 Dependencies

### Main Dependencies
- **express**: Web framework
- **sequelize**: ORM for PostgreSQL
- **pg**: PostgreSQL client
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **@aws-sdk/client-s3**: AWS S3 SDK
- **cors**: CORS middleware
- **dotenv**: Environment variable management

### Dev Dependencies
- **nodemon**: Auto-reload for development
- **sequelize-cli**: Database migration tool


