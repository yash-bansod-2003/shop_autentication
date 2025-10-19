import "reflect-metadata";
import { DataSource } from "typeorm";
import configuration from "./lib/configuration";
import path from "node:path";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: configuration.database.host,
  port: configuration.database.port,
  username: configuration.database.user,
  password: configuration.database.password,
  database: configuration.database.database,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, "entities/**/*.{js,ts}")],
  migrations: [path.join(__dirname, "migrations/**/*.{js,ts}")],
});
