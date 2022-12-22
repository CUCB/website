import { MikroORM } from "@mikro-orm/core";
import makeConfig from "./config";

let orm: MikroORM;
export const makeOrm = async (env) => {
  if (!orm) {
    orm = await MikroORM.init(makeConfig(env));
    await orm.migrator.up();
    const { NecessaryDataSeeder } = await import("../../seeders/NecessaryDataSeeder");
    await orm.seeder.seed(NecessaryDataSeeder);
  }
  return orm.em.fork();
};
