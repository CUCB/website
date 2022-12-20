import { defineConfig } from "@mikro-orm/core";
import makeConfig from "./src/lib/database/config.js";
import dotenv from "dotenv";

dotenv.config();
const config = defineConfig(makeConfig(process.env));

export default config;
