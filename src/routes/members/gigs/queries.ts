import { PopulateHint, wrap, type EntityField, type ObjectQuery } from "@mikro-orm/core";
import type { OperatorMap } from "@mikro-orm/core/typings";
import { DateTime } from "luxon";
import orm from "../../../lib/database";
import { Gig } from "../../../lib/entities/Gig";
import { GigLineup } from "../../../lib/entities/GigLineup";
import { UserInstrument } from "../../../lib/entities/UsersInstrument";
import {
  VIEW_GIG_ADMIN_NOTES,
  VIEW_GIG_CONTACT_DETAILS,
  VIEW_HIDDEN_GIGS,
  VIEW_SIGNUP_SUMMARY,
} from "../../../lib/permissions";
import type { AvailableUserInstrument, SignupGig, SignupSummaryEntry } from "../types";

type Session = { userId: string };

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

const summaryFields = (session: { userId: string }): readonly EntityField<Gig, string>[] => [
  ...generalFields,
  { lineup: lineupFields },
  ...(VIEW_GIG_ADMIN_NOTES.guard(session) ? adminFields : []),
  // TODO should these actually be the same permissions
  ...(VIEW_GIG_ADMIN_NOTES.guard(session) ? financialFields : []),
];

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

// TODO document why separate query filters and result filters are needed
// TODO add motivating tests
const gigQueryFilter = (session: { userId: string }): ObjectQuery<Gig> =>
  !VIEW_HIDDEN_GIGS.guard(session) ? { admins_only: false } : {};

const signupQueryFilter = (session: { userId: string }): ObjectQuery<Gig> => ({
  admins_only: false,
  allow_signups: true,
});

const contactResultFilter = (session: { userId: string }) =>
  !VIEW_GIG_CONTACT_DETAILS.guard(session) ? { contacts: { calling: true } } : {};

const lineupResultFilter = { lineup: { approved: true, user_instruments: { approved: true } } };

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

export const filterAnyGigDate = (filter: OperatorMap<Date>): ObjectQuery<Gig> => ({
  $or: [{ date: filter }, { arrive_time: filter }, { finish_time: filter }],
});

export const bySortDate = (gigA: { sort_date: Date }, gigB: { sort_date: Date }): number =>
  gigA.sort_date.getTime() - gigB.sort_date.getTime();
export const inFuture: ObjectQuery<Gig> = filterAnyGigDate({ $gte: "now()" });
export const inMonth = (date: DateTime): ObjectQuery<Gig> =>
  filterAnyGigDate({
    $gte: date.startOf("month").toISO(),
    $lte: date.endOf("month").toISO(),
  });
export const inCurrentMonth: ObjectQuery<Gig> = inMonth(DateTime.local());

export const fetchMultiGigSummary = (session: Session, filter: ObjectQuery<Gig>): Promise<GigSummary[]> =>
  orm.em
    .fork()
    .find<Gig, string>(
      Gig,
      // TODO maybe a deep merge is required here, but probably not
      { ...filter, ...gigQueryFilter(session) },
      {
        fields: summaryFields(session),
        populateWhere: PopulateHint.INFER,
        orderBy: { date: "asc", lineup: { leader: "desc", equipment: "asc" } },
      },
    )
    .then((gigs) =>
      gigs
        .map((gig_) => {
          const gig = { ...wrap(gig_)?.toPOJO(), sort_date: gig_.sort_date };
          return gig && applyArrayFilter(gig, { ...contactResultFilter(session), ...lineupResultFilter });
        })
        .sort(bySortDate),
    );

export const fetchSpecificGigSummary = (session: Session, id: string | null): Promise<GigSummary> =>
  fetchMultiGigSummary(session, { id }).then((gig) => gig?.[0]);

export const fetchMultiGigSignup = (session: Session, filter: ObjectQuery<Gig>): Promise<SignupGig[]> =>
  orm.em
    .fork()
    .find<Gig, string>(
      Gig,
      { ...filter, ...signupQueryFilter(session) },
      {
        fields: signupFields,
        orderBy: { lineup: { leader: "desc", equipment: "asc" } },
      },
    )
    .then((gigs) =>
      gigs
        .map((gig_) => {
          const gig = { ...wrap(gig_)?.toPOJO(), sort_date: gig_.sort_date };
          return gig && applyArrayFilter(gig, { lineup: { user: { id: session.userId } } });
        })
        .sort(bySortDate),
    );

export const fetchSpecificGigSignup = (session: Session, id: string | null): Promise<SignupGig> =>
  fetchMultiGigSignup(session, { id }).then((gig) => gig?.[0]);

export const fetchAllInstrumentsForUser = (session: Session): Promise<AvailableUserInstrument[]> =>
  orm.em
    .fork()
    .find<UserInstrument>(
      UserInstrument,
      {
        deleted: { $ne: true },
        user: session.userId,
      },
      {
        fields: ["nickname", { instrument: ["id", "name", "novelty"] }, { user: ["id"] }],
        populateWhere: PopulateHint.INFER,
      },
    )
    .then((instruments) => instruments.map((instrument) => wrap(instrument).toPOJO()));

export const fetchMultiGigSignupSummary = (
  session: Session,
  filter: ObjectQuery<GigLineup>,
): Promise<SignupSummaryEntry[] | null> =>
  VIEW_SIGNUP_SUMMARY.guard(session)
    ? orm.em
        .fork()
        .find<GigLineup>(GigLineup, filter, {
          fields: [{ user: ["first", "last"] }, "user_available", "user_only_if_necessary", { gig: ["id"] }],
          populateWhere: PopulateHint.INFER,
        })
        .then((lineup) => lineup.map((entry) => wrap(entry).toPOJO()))
    : Promise.resolve(null);

export const fetchSpecificGigSignupSummary = (session: Session, id: string): Promise<SignupSummaryEntry[] | null> =>
  fetchMultiGigSignupSummary(session, { gig: id });