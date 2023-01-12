import { MikroORM } from "@mikro-orm/core";
import makeConfig from "./config";

let orm: MikroORM;
export const makeOrm = async (env: Record<string, string | undefined>) => {
  if (!orm) {
    orm = await MikroORM.init(makeConfig(env));
    await orm.migrator.up();
    const { DatabaseSeeder } = await import("../../seeders/DatabaseSeeder");
    await orm.seeder.seed(DatabaseSeeder);
    // const { MusicSeeder } = await import("../../seeders/MusicSeeder");
    // await orm.seeder.seed(MusicSeeder);
  }
  return orm.em.fork();
};
