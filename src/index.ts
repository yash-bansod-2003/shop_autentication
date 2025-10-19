import "reflect-metadata";
import { Express } from "express";
import { createServer } from "@/server";
import configuration from "@/lib/configuration";
import { AppDataSource } from "@/data-source";
import logger from "@/lib/logger";

const port = configuration.port;
const host = configuration.host;
const server: Express = createServer();

server.listen(port, host, () => {
  try {
    AppDataSource.initialize()
      .then(() => {
        logger.info(`Server Listening on  http://${host}:${port}`);
      })
      .catch((err) => {
        logger.error("Error during Data Source initialization", err);
        throw err;
      });
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
});
