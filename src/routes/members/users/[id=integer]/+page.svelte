<script lang="ts">
  import Mailto from "../../../../components/Mailto.svelte";
  import { DateTime } from "luxon";
  import InstrumentSelector from "../../../../components/Instruments/InstrumentSelector.svelte";
  import UserInstrumentEditor from "../../../../components/Instruments/UserInstrumentEditor.svelte";
  import AutomaticProfile from "../../../../components/Members/Users/AutomaticProfile.svelte";
  import { fade } from "svelte/transition";
  import ProfilePicture from "../../../../components/Members/Users/ProfilePicture.svelte";
  import Select from "../../../../components/Forms/Select.svelte";
  import type { PageData } from "./$types";
  import type { UserInstrument } from "./types";
  import { makeTitle } from "../../../../view";
  import { String } from "runtypes";

  export let data: PageData;
  let {
    user,
    canEdit,
    canEditInstruments,
    canEditAdminStatus,
    allInstruments,
    allAdminStatuses,
    allPrefs,
    profilePictureUpdated,
  } = data;

  function displayMonth(date: Date | undefined): string | null {
    if (date == undefined) return null;
    const luxonDate = DateTime.fromJSDate(date);
    return luxonDate.toFormat("MMMM yyyy");
  }

  function displayBioMonth(date: Date | null | undefined): string {
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
    const updatedBio = await fetch("", {
      method: "POST",
      body: JSON.stringify({ bio: editedBio?.replace("\n", "").trim() }),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
    if (updatedBio) {
      const bioChangedDate = DateTime.fromISO(updatedBio.bioChangedDate).toJSDate();
      user = { ...user, ...updatedBio, bioChangedDate };
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
    ChangeTypeOfExisting,
  }

  type EditableUserInstrument = Omit<UserInstrument, "id"> & { id: string | undefined };

  type EditInstrument =
    | { state: EditInstrumentState.AddingNew }
    | { state: EditInstrumentState.NotEditing }
    | { state: EditInstrumentState.EditingExisting; currentlyEditing: EditableUserInstrument }
    | { state: EditInstrumentState.ChangeTypeOfExisting; currentlyEditing: UserInstrument };

  let editingInstrument: EditInstrument = {
    state: EditInstrumentState.NotEditing,
  };
  // TODO remove the additional layer of function, it's stupid and inconsistent
  function startAddInstrument() {
    editingInstrument.state = EditInstrumentState.AddingNew;
  }

  function cancelAddInstrument() {
    editingInstrument.state = EditInstrumentState.NotEditing;
  }

  function cancelEditInstrument() {
    editingInstrument.state = EditInstrumentState.NotEditing;
  }

  function deleteInstrument(u_i_id: string) {
    return async (_: Event) => {
      const newInstrument = await fetch(`/members/users/${user.id}/instruments`, {
        method: "DELETE",
        body: JSON.stringify({ userInstrumentId: u_i_id }),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
      if (newInstrument) {
        user.instruments[user.instruments.findIndex((i) => i.id === u_i_id)] = newInstrument;
      } else {
        user.instruments = user.instruments.filter((i) => i.id !== u_i_id);
      }
    };
  }

  function restoreDeletedInstrument(u_i_id: string) {
    return async (_: Event) => {
      const newInstrument = await fetch(`/members/users/${user.id}/instruments`, {
        method: "POST",
        body: JSON.stringify({ userInstrumentId: u_i_id, deleted: false }),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
      user.instruments[user.instruments.findIndex((i) => i.id === u_i_id)] = newInstrument;
    };
  }

  function editInstrument(u_i_id: string) {
    return async (_: Event) => {
      const instrument = user.instruments.find((ui) => ui.id === u_i_id);
      if (instrument) {
        editingInstrument = {
          state: EditInstrumentState.EditingExisting,
          currentlyEditing: instrument,
        };
      } else {
        throw `Could not find user instrument with id: ${u_i_id}`;
      }
    };
  }

  function changeInstrumentType(u_i_id?: string) {
    return async (_: Event) => {
      const instrument = user.instruments.find((ui) => ui.id === u_i_id);
      if (instrument) {
        editingInstrument = {
          state: EditInstrumentState.ChangeTypeOfExisting,
          currentlyEditing: instrument,
        };
      } else {
        editingInstrument = {
          state: EditInstrumentState.AddingNew,
        };
      }
    };
  }

  function editNewInstrument(e: CustomEvent<{ id: string }>) {
    const instr_id = e.detail.id;
    const instrument = allInstruments.find((i) => i.id === instr_id);
    if (instrument) {
      editingInstrument = {
        state: EditInstrumentState.EditingExisting,
        currentlyEditing: {
          nickname: undefined,
          id: undefined,
          instrument,
          deleted: false,
        },
      };
    } else {
      throw `Could not find instrument with id: ${instr_id}`;
    }
  }

  const editExistingInstrument = (existingInstrument: EditableUserInstrument) => (e: CustomEvent<{ id: string }>) => {
    const instr_id = e.detail.id;
    const instrument = allInstruments.find((i) => i.id === instr_id);
    if (instrument) {
      editingInstrument = {
        state: EditInstrumentState.EditingExisting,
        currentlyEditing: {
          ...existingInstrument,
          instrument,
        },
      };
    } else {
      throw `Could not find instrument with id: ${instr_id}`;
    }
  };

  function completeEditInstrument(e: CustomEvent<{ instrument: UserInstrument }>) {
    const instrument = e.detail.instrument;
    const matchingInstrumentIndex = user.instruments.findIndex((ui) => ui.id === instrument.id);
    if (matchingInstrumentIndex > -1) {
      user.instruments[matchingInstrumentIndex] = instrument;
    } else {
      user.instruments.push(instrument);
      // Trigger reactivity
      user.instruments = user.instruments;
    }
    editingInstrument.state = EditInstrumentState.NotEditing;
  }

  function displayInstrumentName(instrument: UserInstrument): string {
    return instrument.nickname
      ? `"${instrument.nickname}" [${instrument.instrument.name}]`
      : instrument.instrument.name;
  }

  async function updateImportantInfo(_e: Event) {
    if (newPassword !== newPasswordConfirm) {
      // TODO handle this
      return;
    }

    let prefs = [
      { name: "attribute.tshirt", value: has_polo },
      { name: "attribute.folder", value: has_folder },
      { name: "attribute.driver", value: is_driver },
      { name: "attribute.car", value: has_car },
      { name: "attribute.leader", value: can_lead },
      { name: "attribute.soundtech", value: can_tech },
    ];

    const prefsIdsByName: Map<string, string> = new Map();
    allPrefs.forEach((pref) => prefsIdsByName.set(pref.name, pref.id));

    message = "Saving...";
    // TODO handle errors
    await fetch(`/members/users/${user.id}/prefs`, {
      method: "POST",
      body: JSON.stringify(
        prefs.map((pref) => ({ pref_id: String.check(prefsIdsByName.get(pref.name)), value: pref.value })),
      ),
      headers: { "Content-Type": "application/json" },
    });
    const variables: Omit<typeof user, "adminType"> & { password?: string; adminType?: string } = {
      ...user,
      adminType: undefined,
      password: newPassword !== "" ? newPassword : undefined,
    };

    if (canEditAdminStatus) {
      variables.adminType = user.adminType.id;
    }
    const body = JSON.stringify(variables);

    // TODO error handling
    const updatedUser = await fetch(`/members/users/${user.id}`, { method: "POST", body }).then((res) => res.json());
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
  .link:focus {
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

  .deleted-instrument {
    text-decoration: line-through;
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
      <figcaption data-test="bio-name">{user.first}{displayBioMonth(user.bioChangedDate)}</figcaption>
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

{#if canEdit && user.mobileContactInfo}
  <p data-test="mobile-number"><b>Mobile contact info:</b> {user.mobileContactInfo}</p>
{/if}
{#if canEdit && user.email}
  <p>
    <b>Email:</b>
    <Mailto person="{{ email_obfus: user.email }}" showEmail="{true}" />
  </p>
{/if}
{#if user.locationInfo}
  <p><b>Location info:</b> {user.locationInfo}</p>
{/if}

<h3>Profile Picture</h3>
<ProfilePicture user="{user}" canEdit="{canEdit}" lastUpdated="{profilePictureUpdated}" />

{#if canEdit}
  <h3>Important Info</h3>
  <form class="important-info" on:submit|preventDefault="{updateImportantInfo}">
    {#if canEditAdminStatus}
      <label for="admin-status">Admin status</label><Select id="admin-status" bind:value="{user.adminType.id}">
        {#each allAdminStatuses as status (status.id)}
          <option value="{status.id}" selected="{status.id === user.adminType.id}">{status.title}</option>
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
        bind:value="{user.mobileContactInfo}"
      />
      <label for="location">Location Info</label><input
        type="text"
        id="location"
        bind:value="{user.locationInfo}"
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
      <!-- TODO fix the regex replacement-->
      <label for="last-login">Last Login</label><input
        type="datetime-local"
        disabled
        id="last-login"
        value="{user.lastLoginDate?.toString().replace(/:\d{2}\.\d{6}\+.*/, '') || '?'}"
      />

      <!-- TODO fix the regex replacement-->
      <label for="join-date">Joined</label><input
        type="{user.joinDate ? 'date' : 'text'}"
        disabled
        id="join-date"
        value="{user.joinDate?.toString().replace(/:\d{2}\.\d{6}\+.*/, '') || '?'}"
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
  {#if editingInstrument.state === EditInstrumentState.EditingExisting}
    <UserInstrumentEditor
      instrument="{editingInstrument.currentlyEditing}"
      user="{user}"
      on:save="{completeEditInstrument}"
      on:changeInstrumentType="{changeInstrumentType(editingInstrument.currentlyEditing.id)}"
      on:cancel="{cancelEditInstrument}"
    />
  {:else if editingInstrument.state === EditInstrumentState.AddingNew}
    <InstrumentSelector allInstruments="{allInstruments}" on:select="{editNewInstrument}" />
    <button on:click="{cancelAddInstrument}" data-test="add-instrument">Cancel</button>
  {:else if editingInstrument.state === EditInstrumentState.ChangeTypeOfExisting}
    <InstrumentSelector
      allInstruments="{allInstruments}"
      on:select="{editExistingInstrument(editingInstrument.currentlyEditing)}"
    />
    <button on:click="{cancelAddInstrument}" data-test="add-instrument">Cancel</button>
  {:else if user.instruments?.length}
    <table>
      <thead><th>Instrument</th></thead>
      {#each user.instruments.filter((i) => !i.deleted) as instrument (instrument.id)}
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
      {#if user.instruments.find((i) => i.deleted)}
        <tr><td colspan="2">****</td></tr>
      {/if}
      {#each user.instruments.filter((i) => i.deleted) as instrument (instrument.id)}
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
