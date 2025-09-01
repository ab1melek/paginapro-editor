const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 3000,
  baseURL: process.env.API_BASE_URL || `http://localhost:3000`,
  db: {
    port: process.env.DB_PORT_APP || 5432,
    host: process.env.DB_HOST_APP || "localhost",
    name: process.env.DB_NAME_APP || "postgres",
    user: process.env.DB_USER_APP || "postgres",
    password: process.env.DB_PASSWORD_APP || "postgres",
  },
};