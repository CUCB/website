import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "./User";

@Entity({ schema: "cucb" })
export class News {
  @PrimaryKey({ columnType: "int8" })
  id!: string;

  @Property({ length: 255 })
  title!: string;

  @Property({ columnType: "text" })
  description!: string;

  @Property({ length: 6, nullable: true })
  posted?: Date;

  @ManyToOne({ entity: () => Users, fieldName: "posted_by", index: "idx_17481_posted_by" })
  postedBy!: Users;
}
