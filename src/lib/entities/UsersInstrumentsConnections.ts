import { Entity, ManyToOne, PrimaryKey } from "@mikro-orm/core";
import { ConnectionTypes } from "./ConnectionTypes.js";
import { UserInstrument } from "./UsersInstrument.js";

@Entity({ schema: "cucb" })
export class UsersInstrumentsConnections {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @ManyToOne({
    entity: () => UserInstrument,
    onUpdateIntegrity: "cascade",
    onDelete: "cascade",
    index: "idx_17532_user_instrument_id",
  })
  userInstrument!: UserInstrument;

  @ManyToOne({ entity: () => ConnectionTypes, onUpdateIntegrity: "cascade", index: "idx_17532_conn_id" })
  conn!: ConnectionTypes;
}
