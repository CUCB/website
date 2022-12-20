import { MikroORM } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
import makeConfig from "./database/config";

const orm = await MikroORM.init(makeConfig(env));

// Export the orm as default
export default orm;
