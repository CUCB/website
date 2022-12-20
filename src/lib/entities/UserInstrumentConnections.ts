import { Entity, ManyToOne, PrimaryKey } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { ConnectionType } from "./ConnectionType.js";
import { UserInstrument } from "./UserInstrument.js";

@Entity({ schema: "cucb", tableName: "users_instruments_connections" })
export class UserInstrumentConnection {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @ManyToOne({
    entity: () => UserInstrument,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    index: "idx_17532_user_instrument_id",
  })
  userInstrument!: Relation<UserInstrument>;

  @ManyToOne({ entity: () => ConnectionType, onUpdateIntegrity: "cascade", index: "idx_17532_conn_id" })
  conn!: ConnectionType;
}
