import { assertLoggedIn } from "../../../../client-auth";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import orm from "../../../../lib/database";
import { Gig } from "../../../../lib/entities/Gig";
import {
  NOT_MUSIC_ONLY,
  VIEW_GIG_ADMIN_NOTES,
  VIEW_GIG_CONTACT_DETAILS,
  VIEW_HIDDEN_GIGS,
  VIEW_SIGNUP_SUMMARY,
} from "../../../../lib/permissions";
import { GigLineup } from "../../../../lib/entities/GigLineup";
import {
  ExceptionConverter,
  PopulateHint,
  wrap,
  type EntityDTO,
  type EntityField,
  type Loaded,
  type ObjectQuery,
} from "@mikro-orm/core";
import { UserInstrument } from "../../../../lib/entities/UsersInstrument";

// TODO refine me a bit
interface Props {
  gig: { title: string; arrive_time?: Date; finish_time?: Date };
  signupGig: any;
  userInstruments: unknown[];
  signupSummary: SignupSummary | null;
}

type SignupSummary = {
  user: {
    first: string;
    last: string;
  };
  user_available?: boolean | null;
  user_only_if_necessary?: boolean | null;
}[];

const gigFilter = (session: { userId: string }): ObjectQuery<Gig> =>
  !VIEW_HIDDEN_GIGS.guard(session) ? { admins_only: false } : {};
const contactFilter = (session: { userId: string }) =>
  !VIEW_GIG_CONTACT_DETAILS.guard(session) ? { contacts: { calling: true } } : {};

const lineupFilter = { lineup: { approved: true, user_instruments: { approved: true } } };
const signupLineupFilter = (session) => ({ lineup: { user: { id: session.userId } } });

// TODO unit test the shit out of me
const testFilter = <T, E>(res: T, filter: ObjectQuery<E>): boolean => {
  if (typeof filter === "object") {
    return Object.entries(filter)
      .map(([key, filter]) => testFilter(res[key], filter))
      .reduce((a, b) => a && b);
  } else {
    return res === filter;
  }
};

// TODO unit test the shit out of me
const applyArrayFilter = <T extends object, E>(res: T, filter: ObjectQuery<E>): T => {
  if (Array.isArray(res)) {
    res = [...res];
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === "object") {
        if (Array.isArray(res?.[0]?.[key])) {
          res = res.map((entry) => ({ ...entry, [key]: applyArrayFilter(entry[key], value) }));
        } else {
          // TODO does this always work? is there a case where res[0][key] is not an array, but a child of res[0][key] is an array??
          res = res.filter((entry) => testFilter(entry[key], value));
        }
      } else {
        res = res.filter((entry) => entry[key] === value);
      }
    }

    return res;
  } else if (typeof res === "object") {
    res = { ...res };
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === "object") {
        res[key] = applyArrayFilter(res[key], value);
      } else {
        console.log([key, value]);
        console.error("MEWOWOOW");
        throw "oh shit";
      }
    }
    return res;
  } else {
    // TODO proper exception
    throw "oh shit";
  }
};

const generalFields: EntityField<Gig, string>[] = [
  "type",
  "date",
  "title",
  "id",
  { venue: ["name", "subvenue", "map_link", "id"] },
  "finish_time",
  "arrive_time",
  "allow_signups",
  "time",
  { contacts: ["calling", { contact: ["name"] }] },
  "summary",
  "notes_band",
  "advertise",
  "food_provided",
];
const lineupFields: EntityField<GigLineup, string>[] = [
  { user: ["id", "first", "last"] },
  { user_instruments: [{ user_instrument: ["id", "nickname", { instrument: ["id", "name"] }] }, "approved"] },
  "leader",
  "money_collector",
  "driver",
  "equipment",
  "approved",
];
const adminFields: EntityField<Gig, string>[] = [
  "notes_admin",
  { contacts: ["client", { contact: ["organization"] }] },
  "admins_only",
];
const financialFields: EntityField<Gig, string>[] = [
  "finance",
  "finance_caller_paid",
  "finance_deposit_received",
  "finance_payment_received",
  "quote_date",
];
const fields = (session: { userId: string }): readonly EntityField<Gig, string>[] => [
  ...generalFields,
  { lineup: lineupFields },
  ...(VIEW_GIG_ADMIN_NOTES.guard(session) ? adminFields : []),
  // TODO should these actually be the same permissions
  ...(VIEW_GIG_ADMIN_NOTES.guard(session) ? financialFields : []),
];

const signupFilter = (session: { userId: string }): ObjectQuery<Gig> => ({
  admins_only: false,
  allow_signups: true,
});

const signupLineupFields: EntityField<GigLineup, string>[] = [
  "approved",
  "user_available",
  "user_only_if_necessary",
  "user_notes",
  { user_instruments: [{ user_instrument: ["id", { instrument: ["name"] }] }, "approved"] },
  { user: ["id", "gig_notes"] },
];

const signupFields: EntityField<Gig, string>[] = [
  "date",
  "title",
  "allow_signups",
  { lineup: signupLineupFields },
  { venue: ["name", "subvenue", "map_link", "id"] },
  "finish_time",
  "arrive_time",
  "time",
];

const myInstrumentsFilter = (session: { userId: string }): ObjectQuery<UserInstrument> => ({
  deleted: { $ne: true },
  user: session.userId,
});
const myInstrumentsFields: EntityField<UserInstrument, string>[] = [
  "nickname",
  { instrument: ["id", "name", "novelty"] },
  { user: ["id"] },
];

const signupSummaryFields: EntityField<GigLineup, string>[] = [
  { user: ["first", "last"] },
  "user_available",
  "user_only_if_necessary",
];

export const filterLineupApproved = <T extends EntityDTO<Loaded<GigLineup, string>>>(lineup: T[]): T[] =>
  lineup
    .filter((entry) => entry.approved)
    .map((entry) => ({ ...entry, user_instruments: entry.user_instruments.filter((entry) => entry.approved) }));

export const filterLineupForUser = <T extends EntityDTO<Loaded<GigLineup, string>>>(
  session: { userId: string },
  lineup: T[],
): T[] => lineup.filter((entry) => entry.user.id === session.userId);

export const load: PageServerLoad = async ({ params: { gig_id }, parent }): Promise<Props> => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const gig = await orm.em
      .fork()
      .findOne<Gig, string>(
        Gig,
        { id: gig_id, ...gigFilter(session) },
        {
          fields: fields(session),
          populateWhere: PopulateHint.INFER,
          orderBy: { lineup: { leader: "desc", equipment: "asc" } },
        },
      )
      .then((gig) => wrap(gig)?.toPOJO())
      .then((gig) => gig && applyArrayFilter(gig, { ...contactFilter(session), ...lineupFilter }));

    const signupGig = await orm.em
      .fork()
      .findOne<Gig, string>(
        Gig,
        { id: gig_id, ...signupFilter(session) },
        {
          fields: signupFields,
          orderBy: { lineup: { leader: "desc", equipment: "asc" } },
        },
      )
      .then((gig) => wrap(gig)?.toPOJO())
      .then((gig) => gig && applyArrayFilter(gig, { lineup: { user: { id: session.userId } } }));

    const signupSummary =
      VIEW_SIGNUP_SUMMARY.guard(session) && gig && gig.allow_signups
        ? await orm.em
            .fork()
            .find<GigLineup>(
              GigLineup,
              { gig: gig_id },
              {
                fields: signupSummaryFields,
                populateWhere: PopulateHint.INFER,
              },
            )
            .then((lineup) => lineup.map((entry) => wrap(entry).toPOJO()))
        : null;

    const userInstruments = await orm.em
      .fork()
      .find<UserInstrument>(UserInstrument, myInstrumentsFilter(session), {
        fields: myInstrumentsFields,
        populateWhere: PopulateHint.INFER,
      })
      .then((instruments) => instruments.map((instrument) => wrap(instrument).toPOJO()));

    if (gig) {
      return {
        gig,
        signupGig,
        userInstruments,
        signupSummary,
      };
    } else {
      throw error(404, "Gig not found");
    }
  } else {
    throw error(403, "You're not allowed to do that");
  }
};
