import { handleErrors } from "../../../../graphql/client";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { assertLoggedIn } from "../../../../client-auth";
import { UPDATE_ADMIN_STATUS, UPDATE_BIO, UPDATE_INSTRUMENTS, IS_SELF } from "$lib/permissions";
import orm from "$lib/database";
import { UserInstrument } from "$lib/entities/UsersInstrument";
import type { EntityManager } from "@mikro-orm/postgresql";
import { User } from "$lib/entities/User";
import { LoadStrategy, PopulateHint, wrap } from "@mikro-orm/core";
import type { EntityField } from "@mikro-orm/core";
import { UserPrefType } from "../../../../lib/entities/UserPrefType";
import { AuthUserType } from "../../../../lib/entities/AuthUserType";
import { GigLineup } from "../../../../lib/entities/GigLineup";
import type { AggregateInstrument, LoadOutput } from "./types";
import { Instrument } from "../../../../lib/entities/Instrument";

const PUBLIC_FIELDS: EntityField<User, string>[] = [
  "id",
  "first",
  "last",
  "bio",
  "bioChangedDate",
  "lastLoginDate",
  "joinDate",
  "instruments",
  { instruments: ["instrument", { instrument: ["id", "name", "novelty"] }, "deleted"] },
];

const SENSITIVE_FIELDS: EntityField<User, string>[] = [
  "email",
  "dietaries",
  "mobileContactInfo",
  "locationInfo",
  "prefs",
  { prefs: ["value", "pref_type", { pref_type: ["name", "default"] }] },
];
const EDITOR_FIELDS: EntityField<User, string>[] = ["adminType"];
const GIG_LINEUP_FIELDS: EntityField<GigLineup, string>[] = [
  "gig",
  "user_instruments",
  {
    gig: ["id", "title", "date"],
    user_instruments: [
      "user_instrument",
      { user_instrument: ["instrument", { instrument: ["id", "name", "novelty"] }] },
    ],
  },
];

export const load: PageServerLoad = async ({ locals, params: { id }, fetch }): Promise<LoadOutput> => {
  const session = assertLoggedIn(locals.session);

  const canEdit = UPDATE_BIO(id).guard(session);
  const canEditInstruments = UPDATE_INSTRUMENTS(id).guard(session);
  const canEditAdminStatus = UPDATE_ADMIN_STATUS(id).guard(session);

  try {
    const em: EntityManager = orm.em.fork() as EntityManager;

    let userFields;
    if (IS_SELF(id).guard(session)) {
      userFields = [...PUBLIC_FIELDS, ...SENSITIVE_FIELDS];
    } else if (canEdit) {
      userFields = [...PUBLIC_FIELDS, ...SENSITIVE_FIELDS, ...EDITOR_FIELDS];
    } else {
      userFields = [...PUBLIC_FIELDS];
    }
    const [userDetails, gig_lineups, allPrefs, allAdminStatuses] = await Promise.all([
      em.findOne(User, id, { fields: userFields }),
      em.fork().find(
        GigLineup,
        { user: { id }, user_instruments: { approved: true } },
        {
          fields: GIG_LINEUP_FIELDS,
          populateWhere: PopulateHint.INFER,
        },
      ),
      em.find(UserPrefType, {}, { filters: ["attribute"] }).then((arr) => arr.map((obj) => wrap(obj).toJSON())),
      canEditAdminStatus
        ? em.find(AuthUserType, {}, { fields: ["id", "title"] }).then((arr) => arr.map((obj) => wrap(obj).toJSON()))
        : Promise.resolve([]),
    ]);

    const qb = em.createQueryBuilder(UserInstrument, "ui");
    qb.joinAndSelect("ui.instrument", "i").groupBy(["i.id"]).select(["i.*", "count(ui.id)"]);
    const allInstruments: AggregateInstrument[] = await qb.execute("all");
    const selectedInstrumentIds = new Set(allInstruments.map((i: { id: string }) => i.id));
    const possibleUnselectedInstruments = await em.find(Instrument, {});
    possibleUnselectedInstruments
      .filter((i) => !selectedInstrumentIds.has(i.id))
      .forEach((i) =>
        allInstruments.push({
          ...i,
          parent_id: i.parent?.id || null,
          parent: undefined,
          user_instruments: undefined,
          count: "0",
        }),
      );
    const profilePictureUpdated = await fetch(`/members/images/users/${id}.jpg/modified`).then((res) => res.text());

    if (userDetails) {
      const userPrefs = userDetails.prefs.toArray();
      const user = {
        ...wrap(userDetails).toJSON(),
        gig_lineups: gig_lineups.map((o) => wrap(o).toJSON()),
        instruments: userDetails.instruments.toArray(),
        prefs: allPrefs.map(
          (pref) =>
            userPrefs.find((p) => p.pref_type.name == pref.name) || {
              pref_type: pref,
              value: pref.default,
            },
        ),
      };
      return {
        user,
        canEdit,
        canEditInstruments,
        allInstruments,
        currentUser: id === session.userId,
        allPrefs,
        profilePictureUpdated,
        canEditAdminStatus,
        allAdminStatuses,
      };
    }
  } catch (e) {
    console.error(e);
    return handleErrors(e);
  }
  throw error(404, "User not found");
};
