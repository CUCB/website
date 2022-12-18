import { QueryGigDetails, QuerySingleGig, QuerySingleGigSignupSummary } from "../../../../graphql/gigs";
import { assertLoggedIn } from "../../../../client-auth";
import { handleErrors, client, clientCurrentUser } from "../../../../graphql/client";
import { get } from "svelte/store";
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
  LoadStrategy,
  PopulateHint,
  wrap,
  type EntityField,
  type FilterQuery,
  type ObjectQuery,
} from "@mikro-orm/core";
import { UserInstrument } from "../../../../lib/entities/UsersInstrument";
import { sign } from "jsonwebtoken";
import Entry from "../../../../components/Gigs/Lineup/Editor/Entry.svelte";

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
  !VIEW_GIG_CONTACT_DETAILS.guard(session) ? { calling: true } : {};
const lineupFilter = { approved: true, user_instruments: { approved: true } };
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
  // TOOD should these actually be the same permissions
  ...(VIEW_GIG_ADMIN_NOTES.guard(session) ? financialFields : []),
];

const signupFilter: ObjectQuery<Gig> = {
  admins_only: false,
  allow_signups: true,
};
const signupFields: EntityField<Gig, string>[] = [
  "date",
  "title",
  "allow_signups",
  { venue: ["name", "subvenue", "map_link", "id"] },
  "finish_time",
  "arrive_time",
  "time",
];

const signupLineupFields: EntityField<GigLineup, string>[] = [
  "user_available",
  "user_only_if_necessary",
  "user_notes",
  { user_instruments: [{ user_instrument: ["id"] }, "approved"] },
  { user: ["id", "gig_notes"] },
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

export const load: PageServerLoad = async ({ params: { gig_id }, parent }): Promise<Props> => {
  const { session } = await parent();
  assertLoggedIn(session);

  if (NOT_MUSIC_ONLY.guard(session)) {
    const em = orm.em.fork();
    const gigRepository = em.fork().getRepository(Gig);
    const gig = await gigRepository
      .findOne(
        { id: gig_id, ...gigFilter(session) },
        {
          fields: fields(session),
          populateWhere: PopulateHint.INFER,
          orderBy: { lineup: { leader: -1, equipment: 1 } },
        },
      )
      .then((gig) => wrap(gig).toPOJO());

    const signupSummary =
      VIEW_SIGNUP_SUMMARY.guard(session) && gig && gig.allow_signups
        ? await em
            .fork()
            .find<GigLineup>(
              GigLineup,
              { gig: gig_id },
              { fields: signupSummaryFields, populateWhere: PopulateHint.INFER },
            )
            .then((lineup) => lineup.map((entry) => wrap(entry).toPOJO()))
        : null;

    const signupGig_ = await em.findOne<Gig>(
      Gig,
      { id: gig_id, ...signupFilter },
      { fields: signupFields, populateWhere: PopulateHint.INFER },
    );

    if (signupGig_) {
      await em.populate(
        signupGig_,
        [
          "lineup",
          "lineup.*",
          "lineup.user",
          "lineup.user_instruments",
          "lineup.user_instruments.user_instrument.instrument",
        ],
        {
          fields: signupLineupFields,
          where: { gig_id, lineup: { user: session.userId } },
        },
      );
    }

    let signupGig = wrap(signupGig_)?.toPOJO();

    const userInstruments = await em
      .fork()
      .find<UserInstrument>(UserInstrument, myInstrumentsFilter(session), {
        fields: myInstrumentsFields,
        populateWhere: PopulateHint.INFER,
      })
      .then((instruments) => instruments.map((instrument) => wrap(instrument).toPOJO()));

    if (gig) {
      gig.lineup = gig.lineup
        .filter((entry) => entry.approved)
        .map((entry) => ({ ...entry, user_instruments: entry.user_instruments.filter((ui) => ui.approved) }));
      return {
        gig,
        signupGig,
        userInstruments,
        signupSummary,
      };
    } else {
      throw error(404, "Gig not found");
    }
  }
};
