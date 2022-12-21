import { MikroORM } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
import makeConfig from "./database/config";
import { NecessaryDataSeeder } from "../seeders/NecessaryDataSeeder";

const orm = await MikroORM.init(makeConfig(env));

orm.migrator.up();
orm.seeder.seed(NecessaryDataSeeder);

// Export the orm as default
export default orm;
