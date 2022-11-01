<script lang="ts">
  import Mailto from "../../../../components/Mailto.svelte";
  import { DateTime } from "luxon";
  import { DeleteUserInstrument, RestoreDeletedUserInstrument } from "../../../../graphql/instruments";
  import InstrumentSelector from "../../../../components/Instruments/InstrumentSelector.svelte";
  import UserInstrumentEditor from "../../../../components/Instruments/UserInstrumentEditor.svelte";
  import AutomaticProfile from "../../../../components/Members/Users/AutomaticProfile.svelte";
  import { browser } from "$app/environment";
  import { fade } from "svelte/transition";
  import ProfilePicture from "../../../../components/Members/Users/ProfilePicture.svelte";
  import Select from "../../../../components/Forms/Select.svelte";
  import type { PageData } from "./$types";
  import { GraphQLClient } from "../../../../graphql/client";
  import type { User, UserInstrument } from "./types";
  import { UpdateBio, UpdateUserAdminStatus, UpdateUserDetails, UpdateUserPrefs } from "../../../../graphql/user";
  import { makeTitle } from "../../../../view";

  export let data: PageData;
  let {
    user,
    canEdit,
    canEditInstruments,
    canEditAdminStatus,
    allInstruments,
    allAdminStatuses,
    currentUser,
    allPrefs,
    profilePictureUpdated,
  } = data;
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
  @import "../../../../sass/themes.scss";
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

<!-- <p>
  Say hi to
  <b>{user.first} {user.last}</b>!
  {user.first}
  joined the site
  {join_date}
  and
  {#if login_date}was last seen online in {login_date}.{:else}hasn't been seen in a long time.{/if}
</p> -->

<!-- TODO support the "[*] We don't always take ourselves too seriously." footnote where novelty instruments are used -->

<!-- {#if gig_count > 0}
  Since joining CUCB,
  {user.first}
  has played
  {gig_count}
  {gig_count > 1 ? "gigs" : "gig"},
  {#if gig_count > 1}most recently{/if}
  on
  <a href="{gigLink(last_gig.gig.id)}">{last_gig_date}</a>.
  {#if gig_count > 1}The first one was back on the <a href="{gigLink(first_gig.gig.id)}">{first_gig_date}</a>.{/if}

  {#if instrument_count > 0}
    {possessive(user.first)}
    instrument of choice would seem to be
    <b>{most_played_instrument}</b>, having played it in
    {percentage(most_played_instrument[1], instrument_gig_count)}
    of their gigs.
    {#if instrument_count > 1}
      Apart from that, they have been known to play
      <b>
          <!-- TODO test this, why the fuck haven't the tests caught this being set to other_instruments[0]????
        {#each other_instruments as instrument, i}
          {instrument}
          {#if i < other_instruments.length - 1}/{/if}
        {/each}
      </b>
    {/if}
  {/if}
{/if} -->
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
