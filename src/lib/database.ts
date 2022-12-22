import { MikroORM } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
import makeConfig from "./database/config";
import { NecessaryDataSeeder } from "../seeders/NecessaryDataSeeder";

let orm;

const makeOrm = async () => {
  orm = await MikroORM.init(makeConfig(env));
  await orm.migrator.up();
  await orm.seeder.seed(NecessaryDataSeeder);
};

await makeOrm();

// Export the orm as default
export default orm;
