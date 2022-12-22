import { MikroORM } from "@mikro-orm/core";
import makeConfig from "./config";

let orm: MikroORM;
export const makeOrm = async (env) => {
  if (!orm) {
    orm = await MikroORM.init(makeConfig(env));
  }
  return orm.em.fork();
};
