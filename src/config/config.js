import dotenv from "dotenv"

  dotenv.config({
    path: process.env.NODE_ENV === "production" ? "./src/.env.production.local" : `./src/.env.${process.env.NODE_ENV || "development"}.local`,
  });
  
const appConfig = {
  API_VERSION: process.env.API_VERSION,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ORIGIN: process.env.ORIGIN,
  DB_URL: process.env.DB_URL,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
};

export { appConfig };