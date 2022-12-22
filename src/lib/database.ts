import { MikroORM } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
import makeConfig from "./database/config";
import { NecessaryDataSeeder } from "../seeders/NecessaryDataSeeder";

let orm: MikroORM | undefined;

const makeOrm = async (): Promise<MikroORM> => {
  if (!orm) {
    orm = await MikroORM.init(makeConfig(env));
    await orm.migrator.up();
    await orm.seeder.seed(NecessaryDataSeeder);
  }
  return orm;
};

// Export the orm as default
export default makeOrm;
