<script context="module" lang="ts">
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  let userNotes: Writable<string | undefined> = writable(undefined);
</script>

<script lang="ts">
  import AnnotatedIcon from "../AnnotatedIcon.svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import TooltipText from "../TooltipText.svelte";
  import InstrumentName from "./InstrumentName.svelte";
  import { themeName, suffix } from "../../view";
  import { DateTime, Settings } from "luxon";
  import type {
    AvailableUserInstrument,
    SignupGig,
    SignupGigLineup,
    SignupGigVenue,
    SignupUserInstrument,
  } from "../../routes/members/types";
  import VenueAddressIcons from "./VenueAddressIcons.svelte";
  export let gig: SignupGig,
    userInstruments: SignupUserInstrument[],
    session: { userId: string },
    initialUserNotes: string;
  export let showLink = true;
  let edit = false;
  Settings.defaultZoneName = "Europe/London";
  $: date = gig.date && DateTime.fromJSDate(gig.date);

  let selectedInstruments: Record<string, AvailableUserInstrument> =
    // @ts-ignore
    gig.lineup.length > 0
      ? Object.assign(
          {},
          // @ts-ignore
          ...gig.lineup[0].user_instruments.map((instrument) => ({
            // TODO deselecting an approved instrument was possible before I changed this,
            // and I think that's not
            [instrument.user_instrument.id]: { ...instrument.user_instrument, ...instrument },
          })),
        )
      : {};

  userInstruments = userInstruments.map((userInstr) =>
    userInstr.user_instrument.id in selectedInstruments
      ? { ...userInstr, chosen: true, approved: selectedInstruments[userInstr.user_instrument.id].approved }
      : { ...userInstr, chosen: false, approved: false },
  );

  if (initialUserNotes !== undefined) $userNotes = initialUserNotes;
  $userNotes || (gig.lineup.length && ($userNotes = gig.lineup[0].user.gig_notes));
  userNotes.subscribe(
    (notes) => typeof notes !== "undefined" && gig.lineup.length && (gig.lineup[0].user.gig_notes = notes),
  );

  // TODO probably make this a typescript enum
  const statuses = {
    YES: {},
    NO: {},
    MAYBE: {},
  };

  const statusFromAvailability = (entry: SignupGigLineup) =>
    (typeof (entry.user_available ?? undefined) !== "undefined" &&
      (entry.user_available ? (entry.user_only_if_necessary ? statuses.MAYBE : statuses.YES) : statuses.NO)) ||
    undefined;

  let status = gig.lineup[0] && statusFromAvailability(gig.lineup[0]);

  const signup = (newStatus: {}) => async () => {
    let user_available = newStatus !== statuses.NO;
    let user_only_if_necessary = newStatus === statuses.MAYBE;
    const body = JSON.stringify({ user_available, user_only_if_necessary });
    let res = await fetch(`/members/gigs/${gig.id}/signup`, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());
    status = statusFromAvailability(res);
    if (gig.lineup.length > 0) {
      gig = {
        ...gig,
        lineup: [
          {
            ...gig.lineup[0],
            user_available,
            user_only_if_necessary,
            user: res.user,
          },
        ],
      };
      $userNotes = gig.lineup[0].user.gig_notes;
    } else {
      gig = {
        ...gig,
        lineup: [
          {
            user_available,
            user_only_if_necessary,
            user_notes: null,
            user_id: session.userId,
            user_instruments: [],
            user: res.user,
          },
        ],
      };
    }
  };

  const updateInstruments = async () => {
    let insert = userInstruments
      .filter((i) => i.chosen && !(i.user_instrument.id in selectedInstruments))
      .map((i) => i.user_instrument);
    let delete_ = userInstruments.filter((i) => !i.chosen).map((i) => i.user_instrument);
    const body = JSON.stringify({ insert, delete: delete_ });
    const res = await fetch(`/members/gigs/${gig.id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).then((res) => res.json());
    // TODO use runtypes to actually assert we know what's going on here
    let inserted: { id: string }[] = res.inserted;
    let deleted = res.deleted.map((instr: { id: string }) => instr.id);

    // Filter deleted instruments from currently selected
    selectedInstruments = Object.assign(
      {},
      ...Object.values(selectedInstruments)
        // TODO removeme toString
        .filter((i) => !deleted.includes(i.id) && !deleted.includes(i.id.toString()))
        .map((instrument) => ({ [instrument.id]: instrument })),
    );

    // Add recently inserted instruments to currently selected
    selectedInstruments = Object.assign(
      selectedInstruments,
      ...inserted.map((instrument: { id: string }) => ({
        [instrument.id]: instrument,
      })),
    );

    // Update userInstruments to display the updated state
    userInstruments = userInstruments.map((userInstr) =>
      userInstr.user_instrument.id in selectedInstruments
        ? { ...userInstr, chosen: true, approved: selectedInstruments[userInstr.user_instrument.id].approved }
        : { ...userInstr, chosen: false, approved: false },
    );

    gig = {
      ...gig,
      lineup: [
        {
          ...gig.lineup[0],
          user_instruments: userInstruments.filter((instrument) => instrument.chosen),
        },
      ],
    };
  };

  const updateNotes = async () => {
    const body = JSON.stringify({
      gig_notes: (gig.lineup[0].user_notes && gig.lineup[0].user_notes.trim()) || null,
      // TODO de-bodge
      gig_id: gig.id.toString(),
      other_notes: (gig.lineup[0].user.gig_notes && gig.lineup[0].user.gig_notes.trim()) || "",
    });
    const res = await fetch(`/members/gigs/${gig.id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).then((res) => res.json());
    if (res) {
      gig.lineup[0].user_notes = res.user_notes;
      gig.lineup[0].user.gig_notes = res.user.gig_notes;
      $userNotes = gig.lineup[0].user.gig_notes;
    } else {
      console.error(res);
    }
  };

  const saveEdits = async () => {
    await updateNotes();
    await updateInstruments();
    edit = false;
  };

  const instrumentTooltip = (_: HTMLLabelElement) => {
    tippy(".disabled", { content: "This instrument is selected as part of a lineup, you can't remove it." });
  };
</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  textarea {
    margin-bottom: 1em;
  }

  .statuses {
    display: flex;
    justify-content: space-around;
    user-select: none;
    max-width: 450px;
    margin-top: 1.5em;
    border: none;
  }

  .statuses :global(.annotated-icon) {
    max-width: 100px;
  }

  label.checkbox {
    flex-direction: row;
    cursor: pointer;
  }

  .notes {
    font-style: italic;
    max-width: 20em;
  }

  button {
    display: flex;
    align-items: center;
  }

  button i {
    font-size: 1.2em;
    padding-left: 5px;
  }

  .gig-signup {
    display: block;
    padding: 1em;
    margin-bottom: 2em;
    border-radius: 5px;
    @include themeifyThemeElement($themes) {
      box-shadow: 0px 0px 5px 0px themed("formColor");
    }
  }
  @media only screen and (max-width: 400px) {
    .statuses {
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    }

    .statuses :global(.annotated-icon) {
      max-width: 100%;
      height: 34px;
      margin-bottom: 0.75em;
    }

    .statuses :global(.annotated-icon div) {
      display: flex;
      align-items: center;
    }

    .statuses :global(.annotated-icon i) {
      margin-right: 10px;
    }
  }

  .disabled {
    @include themeify($themes) {
      color: themed("unselected");
    }
  }

  .none {
    list-style-type: none;
    font-style: italic;
  }

  legend {
    font-family: var(--title);
    font-size: 1.2em;
    padding: 0 0.25em;
  }

  .venue-title {
    display: flex;
    align-items: center;
  }

  .venue-link {
    margin-right: 0.5em;
  }
</style>

<div data-test="gig-signup-{gig.id}" class="gig-signup theme-{$themeName}">
  <h3>
    {#if showLink}<a href="/members/gigs/{gig.id}">{gig.title}</a>{:else}{gig.title}{/if}
    {#if date}<small>
        &nbsp;on <time datetime="{date.toISODate()}"
          >{date.toFormat("cccc d") + suffix(date.day) + date.toFormat(" LLLL yyyy")}</time
        ></small
      >{/if}
  </h3>
  {#if gig.venue}
    <h4 class="venue-title">
      <a href="/members/gigs/venue/{gig.venue.id}" class="venue-link">
        {gig.venue.name}
        {#if gig.venue.subvenue}&nbsp;| {gig.venue.subvenue}{/if}
      </a>
      <VenueAddressIcons venue="{gig.venue}" />
    </h4>
  {/if}
  <fieldset role="radiogroup" class="statuses">
    <AnnotatedIcon
      icon="check"
      color="{status === statuses.YES ? 'var(--positive)' : 'var(--unselected)'}"
      aria-checked="{status === statuses.YES}"
      on:click="{signup(statuses.YES)}"
      data-test="{`gig-${gig.id}-signup-yes`}"
      style="{status === statuses.YES ? 'font-style: italic' : ''}"
      class="{status === statuses.YES ? 'color-positive' : 'color-unselected'}"
    >
      Yes, I'd like to play
    </AnnotatedIcon>
    <AnnotatedIcon
      icon="question"
      color="{status === statuses.MAYBE ? 'var(--neutral)' : 'var(--unselected)'}"
      aria-checked="{status === statuses.MAYBE}"
      on:click="{signup(statuses.MAYBE)}"
      data-test="{`gig-${gig.id}-signup-maybe`}"
      style="{status === statuses.MAYBE ? 'font-style: italic' : ''}"
      class="{status === statuses.MAYBE ? 'color-neutral' : 'color-unselected'}"
    >
      Only if necessary
    </AnnotatedIcon>
    <AnnotatedIcon
      icon="times"
      color="{status === statuses.NO ? 'var(--negative)' : 'var(--unselected)'}"
      aria-checked="{status === statuses.NO}"
      on:click="{signup(statuses.NO)}"
      data-test="{`gig-${gig.id}-signup-no`}"
      style="{status === statuses.NO ? 'font-style: italic' : ''}"
      class="{status === statuses.NO ? 'color-negative' : 'color-unselected'}"
    >
      I am unavailable
    </AnnotatedIcon>
  </fieldset>
  {#if status === statuses.YES || status === statuses.MAYBE}
    <div>
      {#if edit}
        <fieldset>
          <legend>Instruments</legend>
          {#each userInstruments as userInstrument (userInstrument.user_instrument.id)}
            <label
              class="checkbox"
              data-test="{`gig-${gig.id}-signup-instrument-${userInstrument.user_instrument.instrument.id}-toggle`}"
              class:disabled="{userInstrument.approved}"
              use:instrumentTooltip
            >
              <input type="checkbox" bind:checked="{userInstrument.chosen}" disabled="{userInstrument.approved}" />
              {userInstrument.user_instrument.instrument.name}
            </label>
          {:else}
            <p>
              You haven't added any instruments to your account, try adding one to
              <a href="/members/users">your profile</a>
              .
            </p>
          {/each}
        </fieldset>
      {:else}
        <p>Signed up with:</p>
        <ul data-test="{`gig-${gig.id}-signup-instruments-selected`}">
          {#each userInstruments.filter((instr) => instr.user_instrument.id in selectedInstruments) as userInstrument (userInstrument.user_instrument.id)}
            <li>
              <InstrumentName userInstrument="{userInstrument.user_instrument}" />
            </li>
          {:else}
            <li class="none">No instruments selected</li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if edit}
      <fieldset>
        <legend>Notes</legend>
        <label class="notes"> Notes for this gig <textarea bind:value="{gig.lineup[0].user_notes}"></textarea> </label>
        <label class="notes"> General notes <textarea bind:value="{gig.lineup[0].user.gig_notes}"></textarea> </label>
      </fieldset>
      <br />
    {:else if gig.lineup[0].user_notes || $userNotes}
      <div class="user-notes">
        <p>
          <TooltipText content="Notes specific to this particular gig">Notes for this gig:</TooltipText>
        </p>
        <blockquote>{gig.lineup[0].user_notes || "None"}</blockquote>
        <p>
          <TooltipText content="Persistent notes for all gigs you are signed up to">General notes:</TooltipText>
        </p>
        <blockquote>{$userNotes || "None"}</blockquote>
      </div>
    {/if}
    {#if edit}
      <button on:click="{saveEdits}" data-test="{`gig-${gig.id}-signup-save`}">
        Save
        <i class="la la-save"></i>
      </button>
    {:else}
      <button
        on:click="{() => {
          edit = true;
        }}"
        data-test="{`gig-${gig.id}-signup-edit`}"
      >
        Edit
        <i class="la la-pencil"></i>
      </button>
    {/if}
  {/if}
</div>
