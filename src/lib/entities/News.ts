import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import type { Relation } from "./bodge.js";
import { User } from "./User.js";

@Entity({ schema: "cucb" })
export class News {
  @PrimaryKey({ columnType: "int8", type: "int8" })
  id!: string;

  @Property({ length: 255, type: "varchar" })
  title!: string;

  @Property({ columnType: "text", type: "text" })
  description!: string;

  @Property({ length: 6, nullable: true, type: "timestamptz" })
  posted?: Date;

  @ManyToOne({ entity: () => User, fieldName: "posted_by", index: "idx_17481_posted_by" })
  postedBy!: Relation<User>;
}
