import { MikroORM } from "@mikro-orm/core";
import { env } from "$env/dynamic/private";
import makeConfig from "./database/config";
import { DatabaseSeeder } from "../seeders/DatabaseSeeder";
import { MusicSeeder } from "../seeders/MusicSeeder";

let orm: MikroORM | undefined;

const makeOrm = async (): Promise<MikroORM> => {
  if (!orm) {
    orm = await MikroORM.init(makeConfig(env));
    await orm.migrator.up();
    await orm.seeder.seed(DatabaseSeeder);
    await orm.seeder.seed(MusicSeeder);
  }
  return orm;
};

// Export the orm as default
export default makeOrm;
