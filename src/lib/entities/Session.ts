import { Entity, Index, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ schema: "cucb" })
export class Session {
  @PrimaryKey({ type: "varchar" })
  sid!: string;

  @Property({ columnType: "json", type: "json" })
  // TODO add types
  sess!: any;

  @Index({ name: "IDX_session_expire" })
  @Property({ length: 6, type: "datetime" })
  expire!: Date;
}
