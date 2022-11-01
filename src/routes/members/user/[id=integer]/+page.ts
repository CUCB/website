import {
  CurrentUser,
  AdminDetails,
  OtherUser,
  instrumentAdminGuard,
  GuardUpdateAdminStatus,
  AllAdminStatuses,
} from "../../../../graphql/user";
import { GraphQLClient, handleErrors } from "../../../../graphql/client";
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { AllInstruments } from "../../../../graphql/instruments";
import { AllPrefs } from "../../../../graphql/gigs/lineups/users/attributes";
import type { DocumentNode } from "graphql/language/ast";
import type { AdminStatus, Instrument, Pref, User } from "./types";
import { assertLoggedIn } from "../../../../client-auth";

function fulfilledFirst<T>(a: PromiseSettledResult<T>, b: PromiseSettledResult<T>): number {
  if (a.status == "fulfilled") {
    return b.status == "fulfilled" ? 0 : -1;
  } else {
    return b.status == "fulfilled" ? 1 : 0;
  }
}

// Ideally this wouldn't wait for the later promises if the earlier onces succeed, but Promise.allSettled is the nicest API
// I could find to achieve what I wanted
async function firstSuccess<T>(promises: Promise<T>[]): Promise<T | null> {
  let countComplete = 0;
  let total = promises.length;
  let promisesComplete = Array(total).map(() => false);
  let firstResult: null | [T, number] = null;

  return new Promise((resolve, reject) => {
    for (let [p, i] of promises.map((promise, i) => [promise, i] as [Promise<T>, number])) {
      p.then((result) => {
        countComplete += 1;
        if (promisesComplete.slice(0, i).filter((complete) => complete).length === i) {
          resolve(result);
        } else {
          promisesComplete[i] = true;
          if (!firstResult || firstResult[1] > i) {
            firstResult = [result, i];
          }

          if (countComplete === total) {
            resolve(firstResult[0]);
          }
        }
      }).catch((failure) => {
        countComplete += 1;
        if (countComplete === total) {
          // TODO this is non-deterministic as to which failure it returns, maybe it should be deterministic
          reject(failure);
        }
      });
    }
  });
}

type UserByPk = { data: { cucb_users_by_pk: User } };

export async function queryUserById(client: GraphQLClient, query: DocumentNode, id: string): Promise<UserByPk> {
  return client.query<UserByPk["data"]>({
    query,
    variables: { id },
  });
}

enum Edit {
  ALL = 0,
  NOT_INSTRUMENTS = 1,
  NONE = 2,
}

export const load: PageLoad = async ({ params: { id }, parent, fetch }) => {
  const { session } = await parent();
  assertLoggedIn(session);

  const client = new GraphQLClient(fetch);
  const clientCurrentUser = new GraphQLClient(fetch, {
    role: "current_user",
  });

  function fullPermissions<T>(x: T): [T, Edit] {
    return [x, Edit.ALL];
  }
  function noPermissions<T>(x: T): [T, Edit] {
    return [x, Edit.NONE];
  }

  const instrumentAdminPermissions = client
    .mutate({ mutation: instrumentAdminGuard, variables: {} })
    .then(() => Edit.ALL)
    .catch(() => Edit.NOT_INSTRUMENTS);

  const asAdmin = () => Promise.all([queryUserById(client, AdminDetails, id), instrumentAdminPermissions]);
  const asCurrentUser = () => queryUserById(clientCurrentUser, CurrentUser, id).then(fullPermissions);
  const asNormalUser = () => queryUserById(client, OtherUser, id).then(noPermissions);

  try {
    const userDetails = id === session.userId ? asCurrentUser() : firstSuccess([asAdmin(), asNormalUser()]);
    const [[res, permissions], allInstruments, allPrefs, profilePictureUpdated, canEditAdminStatus, allAdminStatuses] =
      await Promise.all([
        userDetails,
        client
          .query<{ cucb_instruments: Instrument[] }>({ query: AllInstruments })
          .then((res) => res.data.cucb_instruments),
        client
          .query<{ cucb_user_pref_types: Pref[] }>({ query: AllPrefs })
          .then((res) => res.data.cucb_user_pref_types),
        fetch(`/members/images/users/${id}.jpg/modified`).then((res) => res.text()),
        (id === session.userId ? clientCurrentUser : client)
          .query({ query: GuardUpdateAdminStatus })
          .then(() => true)
          .catch(() => false),
        client
          .query<{ cucb_auth_user_types: AdminStatus[] }>({ query: AllAdminStatuses })
          .then((res) => res.data.cucb_auth_user_types)
          .catch(() => []),
      ]);
    if (res.data.cucb_users_by_pk) {
      return {
        user: res.data.cucb_users_by_pk,
        canEdit: [Edit.ALL, Edit.NOT_INSTRUMENTS].includes(permissions),
        canEditInstruments: permissions === Edit.ALL,
        allInstruments,
        currentUser: id === session.userId,
        allPrefs,
        profilePictureUpdated,
        canEditAdminStatus,
        allAdminStatuses,
      };
    } else {
      throw error(404, "User not found");
    }
  } catch (e) {
    console.error(e);
    return handleErrors(e);
  }
};
