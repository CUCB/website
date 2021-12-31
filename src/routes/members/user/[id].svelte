<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import { currentUser, adminDetails, otherUser, instrumentAdminGuard } from "../../../graphql/user";
  import { GraphQLClient, handleErrors } from "../../../graphql/client";
  import { makeTitle } from "../../../view";

  export interface Instrument {
    id: number;
    name: string;
    novelty: boolean;
    parent_id: number | null;
    parent_only: boolean;
    users_instruments_aggregate: {
      aggregate: {
        count: number;
      };
    };
  }

  export interface UserInstrument {
    instrument: Instrument;
    deleted: boolean;
    nickname: string | null;
    id: number;
  }

  export interface User {
    id: number;
    first: string;
    last: string;
    bio: string | null;
    bio_changed_date: string | null;
    last_login_date: string | null;
    join_date: string | null;
    mobile_contact_info?: string | null;
    location_info?: string | null;
    email: string | null;
    dietaries: string | null;
    prefs: [
      {
        pref_type: {
          id: number;
          name: string;
        };
        value: boolean;
      },
    ];
    user_prefs: [
      {
        pref_id: number;
      },
    ];
    gig_lineups: [
      {
        gig: {
          id: number;
          title: string;
          date: string | null;
          venue: {
            name: string;
            subvenue: string | null;
          };
        };
        user_instruments: [
          {
            user_instrument: {
              instrument: Instrument;
            };
          },
        ];
      },
    ];
    user_instruments: UserInstrument[];
  }

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
    const bestResult = (await Promise.allSettled(promises)).sort(fulfilledFirst)?.[0];
    if (bestResult.status == "fulfilled") {
      return bestResult.value;
    } else {
      throw bestResult.reason;
    }
  }

  type UserByPk = { data: { cucb_users_by_pk: User } };

  export async function queryUserById(client: GraphQLClient, query: DocumentNode, id: string): Promise<UserByPk> {
    return client.query<UserByPk["data"]>({
      query,
      variables: { id },
    });
  }

  enum Edit {
    ALL,
    NOT_INSTRUMENTS,
    NONE,
  }

  export async function load({ page: { params }, session, fetch }: LoadInput): Promise<LoadOutput> {
    const { id } = params;
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

    const asAdmin = Promise.all([queryUserById(client, adminDetails, id), instrumentAdminPermissions]);
    const asCurrentUser = queryUserById(clientCurrentUser, currentUser, id).then(fullPermissions);
    const asNormalUser = queryUserById(client, otherUser, id).then(noPermissions);

    try {
      const userDetails = id === session.userId ? asCurrentUser : firstSuccess([asAdmin, asNormalUser]);
      const [res, permissions] = await userDetails;
      const allInstruments = (await client.query({ query: AllInstruments })).data.cucb_instruments;

      if (res.data.cucb_users_by_pk) {
        return {
          props: {
            user: res.data.cucb_users_by_pk,
            canEdit: [Edit.ALL, Edit.NOT_INSTRUMENTS].includes(permissions),
            canEditInstruments: permissions === Edit.ALL,
            allInstruments,
            currentUser: id === session.userId,
          },
        };
      } else {
        return { status: 404, error: "User not found" };
      }
    } catch (e) {
      handleErrors(e);
    }
  }
</script>

<script lang="ts">
  import Mailto from "../../../components/Mailto.svelte";
  import { DateTime } from "luxon";
  import type { DocumentNode } from "graphql/language/ast";
  import { AllInstruments } from "../../../graphql/instruments";
  import InstrumentSelector from "../../../components/Instruments/InstrumentSelector.svelte";
  import UserInstrumentEditor from "../../../components/Instruments/UserInstrumentEditor.svelte";
  import AutomaticProfile from "../../../components/Members/Users/AutomaticProfile.svelte";
  import { browser } from "$app/env";

  export let user: User;
  export let canEdit: boolean;
  export let canEditInstruments: boolean;
  // TODO better type
  export let allInstruments: Instrument[];
  export let currentUser: boolean;
  let graphqlClient: GraphQLClient = browser && new GraphQLClient(fetch, currentUser ? { role: "current_user" } : {});

  function displayMonth(date: string | null): string | null {
    if (date == null) return null;
    const luxonDate = DateTime.fromISO(date);
    return luxonDate.toFormat("MMMM yyyy");
  }

  function displayBioMonth(date: string | null): string {
    return date ? `, ${displayMonth(date)}` : ``;
  }

  let has_polo = user.prefs?.find((pref) => pref.pref_type.name == "attribute.tshirt")?.value;
  let has_folder = user.prefs?.find((pref) => pref.pref_type.name == "attribute.folder")?.value;
  let is_driver = user.prefs?.find((pref) => pref.pref_type.name == "attribute.driver")?.value;
  let has_car = user.prefs?.find((pref) => pref.pref_type.name == "attribute.car")?.value;
  let can_lead = user.prefs?.find((pref) => pref.pref_type.name == "attribute.leader")?.value;
  let can_tech = user.prefs?.find((pref) => pref.pref_type.name == "attribute.soundtech")?.value;
  let newPassword = "";
  let newPasswordConfirm = "";

  enum EditInstrumentState {
    EditingExisting,
    AddingNew,
    NotEditing,
  }
  let editingInstrument = EditInstrumentState.NotEditing;
  let currentlyEditingDetails = null;
  // TODO remove the additional layer of function, it's stupid and inconsistent
  function startAddInstrument() {
    editingInstrument = EditInstrumentState.AddingNew;
  }

  function cancelAddInstrument() {
    editingInstrument = EditInstrumentState.NotEditing;
  }

  function cancelEditInstrument() {
    editingInstrument = EditInstrumentState.NotEditing;
  }

  function editInstrument(u_i_id: number) {
    return (_) => {
      editingInstrument = EditInstrumentState.EditingExisting;
      currentlyEditingDetails = user.user_instruments.find((ui) => ui.id === u_i_id);
    };
  }
  function editNewInstrument(e) {
    const instr_id = e.detail.id;
    editingInstrument = EditInstrumentState.EditingExisting;
    currentlyEditingDetails = {
      instr_id,
      nickname: null,
      id: null,
      instrument: allInstruments.find((i) => i.id === instr_id),
    };
  }

  function completeEditInstrument(e) {
    const instrument = e.detail.instrument;
    const matchingInstrumentIndex = user.user_instruments.findIndex((ui) => ui.id === instrument.id);
    if (matchingInstrumentIndex > -1) {
      user.user_instruments[matchingInstrumentIndex] = instrument;
    } else {
      user.user_instruments.push(instrument);
      // Trigger reactivity
      user.user_instruments = user.user_instruments;
    }
    editingInstrument = EditInstrumentState.NotEditing;
  }

  function displayInstrumentName(instrument: UserInstrument): string {
    return instrument.nickname
      ? `"${instrument.nickname}" [${instrument.instrument.name}]`
      : instrument.instrument.name;
  }
</script>

<style lang="scss">
  @import "../../../sass/themes.scss";
  .bits-and-bobs {
    display: grid;
    grid-template-columns: max-content auto;
    justify-items: left;
    /* flex-grow: 1; */
  }
  .bits-and-bobs label {
    padding-left: 0.5em;
    padding-right: 1em;
    justify-self: stretch;
  }
  .bits-and-bobs :nth-child(4n),
  .bits-and-bobs :nth-child(4n + 5) {
    background: rgba(var(--accent_triple), 0.1);
  }
  .important-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .key-info {
    flex: 2 0 max-content;
    max-width: 100%;
    box-sizing: border-box;
  }
  @media only screen and (max-width: 300px) {
    .important-info {
      border: none;
    }
  }
  .link:focus,
  .link > span:focus {
    outline: none;
    box-shadow: none;
  }

  button.link:hover {
    filter: none;
  }
  button.link {
    border-top: none;
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
    height: auto;
    width: auto;
  }

  .link:focus > span {
    outline: 2px solid;
    @include themeify($themes) {
      outline-color: themed("textColor");
    }
    outline-offset: 0.15em;
  }
</style>

<svelte:head>
  <title>{makeTitle(`${user.first} ${user.last}`)}</title>
</svelte:head>

{#if canEdit}
  <h2>Edit mini biography</h2>
{/if}
{#if user.bio}
  <figure>
    <blockquote>{user.bio}</blockquote>
    <figcaption>{user.first}{displayBioMonth(user.bio_changed_date)}</figcaption>
  </figure>
{:else}
  <blockquote class="empty">No bio written yet!</blockquote>
{/if}
{#if canEdit}
  <h2>Automatic profile</h2>
{/if}
<AutomaticProfile user="{user}" />

{#if user.mobile_contact_info}
  <p><b>Mobile contact info:</b> {user.mobile_contact_info}</p>
{/if}
{#if user.email}
  <p>
    <b>Email:</b>
    <Mailto person="{{ email_obfus: user.email }}" showEmail="{true}" />
  </p>
{/if}
{#if user.location_info}
  <p><b>Location info:</b> {user.location_info}</p>
{/if}

<h3>Profile Picture</h3>
<img src="images/users/{user.id}.jpg" width="200" height="250" alt="{user.first} {user.last}" />

{#if canEdit}
  <h3>Important Info</h3>
  <div class="important-info">
    <fieldset class="key-info">
      <legend>Key Info</legend>
      <label for="first-name">First Name(s)</label><input
        type="text"
        required
        id="first-name"
        autocomplete="given-name"
        bind:value="{user.first}"
      />
      <label for="surname">Surname</label><input
        type="text"
        required
        id="surname"
        bind:value="{user.last}"
        autocomplete="family-name"
      />
      <label for="mobile">Mobile Contact Info</label><input
        type="text"
        id="mobile"
        bind:value="{user.mobile_contact_info}"
      />
      <label for="location">Location Info</label><input
        type="text"
        id="location"
        bind:value="{user.location_info}"
        placeholder="Helpful for gig pickups!"
      />
      <label for="dietaries">Dietary Requirements (if none, enter 'None')</label><input
        type="text"
        id="dietaries"
        bind:value="{user.dietaries}"
      />
      <label for="email">Email address</label><input
        type="email"
        id="email"
        required
        bind:value="{user.email}"
        autocomplete="email"
      />
      <label for="password">New Password</label><input
        type="password"
        id="password"
        bind:value="{newPassword}"
        autocomplete="new-password"
      />
      <label for="password-confirm">New Password [confirm]</label><input
        type="password"
        id="password-confirm"
        autocomplete="new-password"
        required="{newPassword.length > 0}"
        bind:value="{newPasswordConfirm}"
      />
      <label for="last-login">Last Login</label><input
        type="datetime-local"
        disabled
        id="last-login"
        value="{user.last_login_date.toString().replace(/:\d{2}\.\d{6}\+.*/, '') || '?'}"
      />

      <label for="join-date">Joined</label><input
        type="{user.join_date ? 'date' : 'text'}"
        disabled
        id="join-date"
        value="{user.join_date?.toString().replace(/:\d{2}\.\d{6}\+.*/, '') || '?'}"
      />
    </fieldset>
    <fieldset class="bits-and-bobs">
      <legend>Bits & bobs</legend>
      <label for="has-polo">Has band polo shirt?</label>
      <div><input type="checkbox" id="has-polo" bind:checked="{has_polo}" /></div>
      <label for="has-folder">Has folder?</label>
      <div><input type="checkbox" id="has-folder" bind:checked="{has_folder}" /></div>
      <label for="is-driver">Driver?</label>
      <div><input type="checkbox" id="is-driver" bind:checked="{is_driver}" /></div>
      <label for="has-car">Has a car?</label>
      <div><input type="checkbox" id="has-car" bind:checked="{has_car}" /></div>
      <label for="can-tech">Can soundtech?</label>
      <div><input type="checkbox" id="can-tech" bind:checked="{can_tech}" /></div>
      <label for="can-lead">Can lead?</label>
      <div><input type="checkbox" id="can-lead" bind:checked="{can_lead}" /></div>
    </fieldset>
    <button>Save changes</button>
  </div>
{/if}
{#if canEditInstruments}
  <h3>Edit instruments</h3>
  {#if editingInstrument === EditInstrumentState.EditingExisting}
    <UserInstrumentEditor
      instrument="{currentlyEditingDetails}"
      client="{graphqlClient}"
      on:save="{completeEditInstrument}"
      on:cancel="{cancelEditInstrument}"
    />
  {:else if editingInstrument === EditInstrumentState.AddingNew}
    <InstrumentSelector allInstruments="{allInstruments}" on:select="{editNewInstrument}" />
    <button class="link" on:click="{cancelAddInstrument}" data-test="add-instrument">Cancel</button>
  {:else if user.user_instruments?.length}
    <table>
      <thead><th>Instrument</th></thead>
      {#each user.user_instruments as instrument (instrument.id)}
        <tr data-test="user-instrument-{instrument.id}">
          <td data-test="name">{displayInstrumentName(instrument)}</td>
          <td
            ><button class="link" on:click="{editInstrument(instrument.id)}" data-test="edit-instrument-{instrument.id}"
              >Edit</button
            >/<button class="link" data-test="delete-instrument-{instrument.id}">Delete</button></td
          >
        </tr>
      {/each}
    </table>
    <button class="link" on:click="{startAddInstrument}" data-test="add-instrument">Add new instrument</button>
  {:else}
    <p>No instruments found.</p>
    <button class="link" on:click="{startAddInstrument}" data-test="add-instrument">Add new instrument</button>
  {/if}
{/if}
