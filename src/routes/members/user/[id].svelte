<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import {
    CurrentUser,
    AdminDetails,
    OtherUser,
    instrumentAdminGuard,
    UpdateUserDetails,
    UpdateUserPrefs,
    UpdateBio,
    GuardUpdateAdminStatus,
    AllAdminStatuses,
    UpdateUserAdminStatus,
  } from "../../../graphql/user";
  import { GraphQLClient, handleErrors } from "../../../graphql/client";
  import { makeTitle } from "../../../view";

  export interface AdminStatus {
    id: number;
    title: string;
  }

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
    admin_type?: {
      id: number;
      title: string;
    };
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

  export interface Pref {
    id: number;
    name: string;
    default: boolean;
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

    const asAdmin = () => Promise.all([queryUserById(client, AdminDetails, id), instrumentAdminPermissions]);
    const asCurrentUser = () => queryUserById(clientCurrentUser, CurrentUser, id).then(fullPermissions);
    const asNormalUser = () => queryUserById(client, OtherUser, id).then(noPermissions);

    try {
      const userDetails = id === session.userId ? asCurrentUser() : firstSuccess([asAdmin(), asNormalUser()]);
      const [
        [res, permissions],
        allInstruments,
        allPrefs,
        profilePictureUpdated,
        canEditAdminStatus,
        allAdminStatuses,
      ] = await Promise.all([
        userDetails,
        client.query<{ cucb_instruments: unknown }>({ query: AllInstruments }).then((res) => res.data.cucb_instruments),
        client
          .query<{ cucb_user_pref_types: unknown }>({ query: AllPrefs })
          .then((res) => res.data.cucb_user_pref_types),
        fetch(`/members/images/users/${id}.jpg/modified`).then((res) => res.text()),
        (id === session.userId ? clientCurrentUser : client)
          .query({ query: GuardUpdateAdminStatus })
          .then(() => true)
          .catch(() => false),
        client
          .query<{ cucb_auth_user_types: unknown }>({ query: AllAdminStatuses })
          .then((res) => res.data.cucb_auth_user_types)
          .catch(() => []),
      ]);
      if (res.data.cucb_users_by_pk) {
        return {
          props: {
            user: res.data.cucb_users_by_pk,
            canEdit: [Edit.ALL, Edit.NOT_INSTRUMENTS].includes(permissions),
            canEditInstruments: permissions === Edit.ALL,
            allInstruments,
            currentUser: id === session.userId,
            allPrefs,
            profilePictureUpdated,
            canEditAdminStatus,
            allAdminStatuses,
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
  import { AllInstruments, DeleteUserInstrument, RestoreDeletedUserInstrument } from "../../../graphql/instruments";
  import InstrumentSelector from "../../../components/Instruments/InstrumentSelector.svelte";
  import UserInstrumentEditor from "../../../components/Instruments/UserInstrumentEditor.svelte";
  import AutomaticProfile from "../../../components/Members/Users/AutomaticProfile.svelte";
  import { browser } from "$app/env";
  import { fade } from "svelte/transition";
  import { AllPrefs } from "../../../graphql/gigs/lineups/users/attributes";
  import ProfilePicture from "../../../components/Members/Users/ProfilePicture.svelte";
  import Select from "../../../components/Forms/Select.svelte";

  export let user: User;
  export let canEdit: boolean;
  export let canEditInstruments: boolean;
  export let canEditAdminStatus: boolean;
  export let allInstruments: Instrument[];
  export let allAdminStatuses: AdminStatus[];
  export let currentUser: boolean;
  // TODO better type
  export let allPrefs: Pref[];
  export let profilePictureUpdated: string;
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
  let message = "";

  let editedBio = user.bio;
  let editingBio = false;

  function startEditBio() {
    editingBio = true;
  }

  async function saveBio() {
    const res = await graphqlClient.mutate<{
      update_cucb_users_by_pk: { bio: string | null; bio_changed_date: string | null };
    }>({
      mutation: UpdateBio,
      variables: { id: user.id, bio: editedBio?.replace("\n", "").trim() || null },
    });
    const updatedBio = res.data.update_cucb_users_by_pk;
    if (updatedBio) {
      user = { ...user, ...updatedBio };
      editingBio = false;
    } else {
      // TODO handle this error somehow
    }
  }

  async function cancelEditBio() {
    editedBio = user.bio;
    editingBio = false;
  }

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

  function deleteInstrument(u_i_id: number) {
    return async (_) => {
      const res = await graphqlClient.mutate<{ update_cucb_users_instruments_by_pk: UserInstrument }>({
        mutation: DeleteUserInstrument,
        variables: { id: u_i_id },
      });
      const newInstrument = res.data.update_cucb_users_instruments_by_pk;
      if (newInstrument) {
        user.user_instruments[user.user_instruments.findIndex((i) => i.id === u_i_id)] = newInstrument;
      } else {
        user.user_instruments = user.user_instruments.filter((i) => i.id !== u_i_id);
      }
    };
  }

  function restoreDeletedInstrument(u_i_id: number) {
    return async (_) => {
      const res = await graphqlClient.mutate<{ update_cucb_users_instruments_by_pk: UserInstrument }>({
        mutation: RestoreDeletedUserInstrument,
        variables: { id: u_i_id },
      });
      const newInstrument = res.data.update_cucb_users_instruments_by_pk;
      user.user_instruments[user.user_instruments.findIndex((i) => i.id === u_i_id)] = newInstrument;
    };
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
      user_id: user.id,
    };
    console.log(currentlyEditingDetails);
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

  async function updateImportantInfo(_e) {
    let prefs = [
      { name: "attribute.tshirt", value: has_polo },
      { name: "attribute.folder", value: has_folder },
      { name: "attribute.driver", value: is_driver },
      { name: "attribute.car", value: has_car },
      { name: "attribute.leader", value: can_lead },
      { name: "attribute.soundtech", value: can_tech },
    ];

    let prefsIdsByName = {};
    allPrefs.forEach((pref) => (prefsIdsByName[pref.name] = pref.id));

    message = "Saving...";
    // TODO handle errors
    await graphqlClient.mutate({
      mutation: UpdateUserPrefs,
      variables: {
        prefs: prefs.map((pref) => ({
          pref_id: prefsIdsByName[pref.name],
          user_id: currentUser ? undefined : user.id,
          value: pref.value,
        })),
      },
    });
    if (canEditAdminStatus) {
      await graphqlClient.mutate({
        mutation: UpdateUserAdminStatus,
        variables: {
          user_id: user.id,
          admin: user.admin_type.id,
        },
      });
    }
    // TODO handle updating password
    const variables = {
      id: user.id,
      first: user.first,
      last: user.last,
      email: user.email,
      mobile_contact_info: user.mobile_contact_info,
      location_info: user.location_info,
      dietaries: user.dietaries,
    };
    const res = await graphqlClient.mutate<{ update_cucb_users_by_pk: User }>({
      mutation: UpdateUserDetails,
      variables,
    });
    const updatedUser = res.data.update_cucb_users_by_pk;
    if (updatedUser) {
      user = { ...user, ...updatedUser };
      has_polo = user.prefs?.find((pref) => pref.pref_type.name == "attribute.tshirt")?.value;
      has_folder = user.prefs?.find((pref) => pref.pref_type.name == "attribute.folder")?.value;
      is_driver = user.prefs?.find((pref) => pref.pref_type.name == "attribute.driver")?.value;
      has_car = user.prefs?.find((pref) => pref.pref_type.name == "attribute.car")?.value;
      can_lead = user.prefs?.find((pref) => pref.pref_type.name == "attribute.leader")?.value;
      can_tech = user.prefs?.find((pref) => pref.pref_type.name == "attribute.soundtech")?.value;
    }
    message = "Saved details";
    setTimeout(() => (message = ""), 2000);
  }
</script>

<style lang="scss">
  @import "../../../sass/themes.scss";
  @function shadow($color) {
    @return 0 0 5px $color;
  }
  .bits-and-bobs {
    display: grid;
    grid-template-columns: max-content auto;
    justify-items: left;
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
  .deleted-instrument {
    text-decoration: line-through;
  }
  img {
    @include themeifyThemeElement($themes) {
      box-shadow: shadow(themed("text"));
    }
  }
</style>

<svelte:head>
  <title>{makeTitle(`${user.first} ${user.last}`)}</title>
</svelte:head>

{#if canEdit}
  <h2>Edit mini biography</h2>
{/if}
{#if editingBio}
  <textarea data-test="bio-content" bind:value="{editedBio}" maxlength="400" cols="60" rows="8"></textarea>
  <button data-test="save-bio" on:click="{saveBio}">Save</button>
  <button data-test="cancel-bio-edit" on:click="{cancelEditBio}">Cancel</button>
{:else}
  {#if user.bio}
    <figure>
      <blockquote data-test="bio-content">{user.bio}</blockquote>
      <figcaption data-test="bio-name">{user.first}{displayBioMonth(user.bio_changed_date)}</figcaption>
    </figure>
  {:else}
    <blockquote data-test="bio-empty" class="empty">No bio written yet!</blockquote>
  {/if}
  {#if canEdit}
    <button data-test="edit-bio" on:click="{startEditBio}">Edit bio</button>
  {/if}
{/if}
{#if canEdit}
  <h2>Automatic profile</h2>
{/if}
<AutomaticProfile user="{user}" />

{#if canEdit && user.mobile_contact_info}
  <p data-test="mobile-number"><b>Mobile contact info:</b> {user.mobile_contact_info}</p>
{/if}
{#if canEdit && user.email}
  <p>
    <b>Email:</b>
    <Mailto person="{{ email_obfus: user.email }}" showEmail="{true}" />
  </p>
{/if}
{#if user.location_info}
  <p><b>Location info:</b> {user.location_info}</p>
{/if}

<ProfilePicture user="{user}" canEdit="{canEdit}" lastUpdated="{profilePictureUpdated}" />

{#if canEdit}
  <h3>Important Info</h3>
  <form class="important info" on:submit|preventDefault="{updateImportantInfo}">
    {#if canEditAdminStatus}
      <label for="admin-status">Admin status</label><Select id="admin-status" bind:value="{user.admin_type.id}">
        {#each allAdminStatuses as status (status.id)}
          <option value="{status.id}" selected="{status.id === user.admin_type.id}">{status.title}</option>
        {/each}
      </Select>
    {/if}
    <!-- TODO make this more prominent/not cause the form to move-->
    {#if message}
      <p transition:fade>{message}</p>
    {/if}
    <fieldset class="key-info">
      <legend>Key Info</legend>
      <!-- TODO nice validation stuff/some validation -->
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
        value="{user.last_login_date?.toString().replace(/:\d{2}\.\d{6}\+.*/, '') || '?'}"
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
    <button type="submit" data-test="save-user-details">Save changes</button>
  </form>
{/if}
{#if canEditInstruments}
  <h3>Edit instruments</h3>
  {#if editingInstrument === EditInstrumentState.EditingExisting}
    <UserInstrumentEditor
      instrument="{currentlyEditingDetails}"
      client="{graphqlClient}"
      currentUser="{currentUser}"
      on:save="{completeEditInstrument}"
      on:cancel="{cancelEditInstrument}"
    />
  {:else if editingInstrument === EditInstrumentState.AddingNew}
    <InstrumentSelector allInstruments="{allInstruments}" on:select="{editNewInstrument}" />
    <button on:click="{cancelAddInstrument}" data-test="add-instrument">Cancel</button>
  {:else if user.user_instruments?.length}
    <table>
      <thead><th>Instrument</th></thead>
      {#each user.user_instruments.filter((i) => !i.deleted) as instrument (instrument.id)}
        <tr data-test="user-instrument-{instrument.id}">
          <td data-test="name">{displayInstrumentName(instrument)}</td>
          <td
            ><button on:click="{editInstrument(instrument.id)}" data-test="edit-instrument-{instrument.id}" class="link"
              >Edit</button
            >/<button
              data-test="delete-instrument-{instrument.id}"
              on:click="{deleteInstrument(instrument.id)}"
              class="link">Delete</button
            ></td
          >
        </tr>
      {/each}
      {#if user.user_instruments.find((i) => i.deleted)}
        <tr><td colspan="2">****</td></tr>
      {/if}
      {#each user.user_instruments.filter((i) => i.deleted) as instrument (instrument.id)}
        <tr data-test="user-instrument-{instrument.id}">
          <td data-test="name"><span class="deleted-instrument">{displayInstrumentName(instrument)}</span> (deleted)</td
          >
          <td
            ><button data-test="delete-instrument-{instrument.id}" on:click="{restoreDeletedInstrument(instrument.id)}"
              >Restore</button
            ></td
          >
        </tr>
      {/each}
    </table>
    <button on:click="{startAddInstrument}" data-test="add-instrument">Add new instrument</button>
  {:else}
    <p>No instruments found.</p>
    <button on:click="{startAddInstrument}" data-test="add-instrument">Add new instrument</button>
  {/if}
{/if}
