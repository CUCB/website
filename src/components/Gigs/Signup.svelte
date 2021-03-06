<script context="module">
  import { writable } from "svelte/store";
  let userNotes = writable(undefined);
</script>

<script>
  import AnnotatedIcon from "../AnnotatedIcon.svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import TooltipText from "../TooltipText.svelte";
  import { clientCurrentUser } from "../../graphql/client";
  import { UpdateSignupStatus, UpdateSignupInstruments, UpdateSignupNotes } from "../../graphql/gigs";
  import { stores } from "@sapper/app";
  import InstrumentName from "./InstrumentName.svelte";
  import { themeName, suffix } from "../../view";
  import { DateTime, Settings } from "luxon";
  export let gig, userInstruments;
  export let showLink = true;
  let edit = false;
  Settings.defaultZoneName = "Europe/London";
  $: date = gig.date && DateTime.fromISO(gig.date);

  let selectedInstruments =
    gig.lineup.length > 0
      ? Object.assign(
          {},
          ...gig.lineup[0].user_instruments.map((instrument) => ({ [instrument.user_instrument_id]: instrument })),
        )
      : {};

  userInstruments = userInstruments.map((userInstr) =>
    userInstr.id in selectedInstruments
      ? { ...userInstr, chosen: true, approved: selectedInstruments[userInstr.id].approved }
      : { ...userInstr, chosen: false, approved: false },
  );

  let { session } = stores();

  $userNotes || (gig.lineup.length && ($userNotes = gig.lineup[0].user.gig_notes));
  userNotes.subscribe(
    (notes) => typeof notes !== "undefined" && gig.lineup.length && (gig.lineup[0].user.gig_notes = notes),
  );

  const statuses = {
    YES: {},
    NO: {},
    MAYBE: {},
  };

  const statusFromAvailability = (entry) =>
    (typeof entry.user_available !== "undefined" &&
      (entry.user_available ? (entry.user_only_if_necessary ? statuses.MAYBE : statuses.YES) : statuses.NO)) ||
    undefined;

  let status = gig.lineup[0] && statusFromAvailability(gig.lineup[0]);

  const signup = (newStatus) => async () => {
    let user_available = newStatus !== statuses.NO;
    let user_only_if_necessary = newStatus === statuses.MAYBE;
    let res = await $clientCurrentUser.mutate({
      mutation: UpdateSignupStatus,
      variables: {
        gig_id: gig.id,
        user_only_if_necessary,
        user_available,
      },
    });
    let returning = res.data.insert_cucb_gigs_lineups.returning;
    status = statusFromAvailability(returning[0]);
    if (gig.lineup.length > 0) {
      gig = {
        ...gig,
        lineup: [
          {
            ...gig.lineup[0],
            user_available,
            user_only_if_necessary,
            user: returning[0].user,
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
            user_id: $session.userId,
            user_instruments: [],
            user: returning[0].user,
          },
        ],
      };
    }
  };

  const updateInstruments = async () => {
    let to_add = userInstruments
      .filter((i) => i.chosen && !(i.id in selectedInstruments))
      .map((i) => ({ gig_id: gig.id, user_instrument_id: i.id }));
    let to_remove = userInstruments.filter((i) => !i.chosen).map((i) => i.id);
    let res = await $clientCurrentUser.mutate({
      mutation: UpdateSignupInstruments,
      variables: {
        to_add,
        to_remove,
        gig_id: gig.id,
      },
    });
    let inserted = res.data.insert_cucb_gigs_lineups_instruments.returning;
    let deleted = res.data.delete_cucb_gigs_lineups_instruments.returning.map((instr) => instr.user_instrument_id);

    // Filter deleted instruments from currently selected
    selectedInstruments = Object.assign(
      {},
      ...Object.values(selectedInstruments)
        .filter((i) => !deleted.includes(i.user_instrument_id))
        .map((instrument) => ({ [instrument.user_instrument_id]: instrument })),
    );

    // Add recently inserted instruments to currently selected
    selectedInstruments = Object.assign(
      selectedInstruments,
      ...inserted.map((instrument) => ({ [instrument.user_instrument_id]: instrument })),
    );

    // Update userInstruments to display the updated state
    userInstruments = userInstruments.map((userInstr) =>
      userInstr.id in selectedInstruments
        ? { ...userInstr, chosen: true, approved: selectedInstruments[userInstr.id].approved }
        : { ...userInstr, chosen: false, approved: false },
    );

    gig = {
      ...gig,
      lineup: [
        {
          ...gig.lineup[0],
          user_instruments: userInstruments
            .filter((instrument) => instrument.chosen)
            .map((instrument) => ({ ...instrument, user_instrument_id: instrument.id })),
        },
      ],
    };
  };

  const updateNotes = async () => {
    let res = await $clientCurrentUser.mutate({
      mutation: UpdateSignupNotes,
      variables: {
        gig_notes: gig.lineup[0].user_notes && gig.lineup[0].user_notes.trim(),
        gig_id: gig.id,
        other_notes: (gig.lineup[0].user.gig_notes && gig.lineup[0].user.gig_notes.trim()) || "",
      },
    });
    if (res.data) {
      gig.lineup[0].user_notes = res.data.update_cucb_gigs_lineups.returning[0].user_notes;
      gig.lineup[0].user.gig_notes = res.data.update_cucb_users.returning[0].gig_notes;
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

  const instrumentTooltip = (_) => {
    tippy(".disabled", { content: "This instrument is selected as part of a lineup, you can't remove it." });
  };

</script>

<style lang="scss">
  @import "../../sass/themes.scss";

  status-icons {
    display: flex;
    justify-content: space-around;
    user-select: none;
    max-width: 450px;
    margin-top: 1.5em;
  }

  status-icons :global(.annotated-icon) {
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

  gig-signup {
    display: block;
    padding: 1em;
    margin-bottom: 2em;
    border-radius: 5px;
    @include themeifyThemeElement($themes) {
      box-shadow: 0px 0px 5px 0px themed("formColor");
    }
  }

  @media only screen and (max-width: 400px) {
    status-icons {
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
    }

    status-icons :global(.annotated-icon) {
      max-width: 100%;
      height: 34px;
      margin-bottom: 0.75em;
    }

    status-icons :global(.annotated-icon div) {
      display: flex;
      align-items: center;
    }

    status-icons :global(.annotated-icon i) {
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
</style>

<gig-signup data-test="gig-signup-{gig.id}" class="theme-{$themeName}">
  <h3>
    {#if showLink}<a href="/members/gigs/{gig.id}">{gig.title}</a>{:else}{gig.title}{/if}
    {#if date}
      <small>
        &nbsp;on
        {date.toFormat('cccc d') + suffix(date.day) + date.toFormat(' LLLL yyyy')}
      </small>
    {/if}
  </h3>
  {#if gig.venue}
    <h4>
      <a href="/members/gigs/venue/{gig.venue.id}">
        {gig.venue.name}
        {#if gig.venue.subvenue}&nbsp;| {gig.venue.subvenue}{/if}
      </a>
    </h4>
  {/if}
  <status-icons role="radiogroup">
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
  </status-icons>
  {#if status === statuses.YES || status === statuses.MAYBE}
    <user-instruments>
      {#if edit}
        <span class="notes">Instruments</span>
        {#each userInstruments as userInstrument (userInstrument.id)}
          <label
            class="checkbox"
            data-test="{`gig-${gig.id}-signup-instrument-${userInstrument.instrument.id}-toggle`}"
            class:disabled="{userInstrument.approved}"
            use:instrumentTooltip
          >
            <input type="checkbox" bind:checked="{userInstrument.chosen}" disabled="{userInstrument.approved}" />
            {userInstrument.instrument.name}
          </label>
        {:else}
          <p>
            You haven't added any instruments to your account, try adding one to
            <a href="/members/user">your profile</a>
            .
          </p>
        {/each}
      {:else}
        <p>Signed up with:</p>
        <ul data-test="{`gig-${gig.id}-signup-instruments-selected`}">
          {#each userInstruments.filter((instr) => instr.id in selectedInstruments) as userInstrument (userInstrument.id)}
            <li>
              <InstrumentName userInstrument="{userInstrument}" />
            </li>
          {:else}
            <li class="none">No instruments selected</li>
          {/each}
        </ul>
      {/if}
    </user-instruments>
    <user-notes>
      {#if edit}
        <label class="notes"> Notes for this gig <textarea bind:value="{gig.lineup[0].user_notes}"></textarea> </label>
        <label class="notes"> General notes <textarea bind:value="{gig.lineup[0].user.gig_notes}"></textarea> </label>
        <br />
      {:else if gig.lineup[0].user_notes || $userNotes}
        <p>
          <TooltipText content="Notes specific to this particular gig">Notes for this gig:</TooltipText>
        </p>
        <blockquote>{gig.lineup[0].user_notes || 'None'}</blockquote>
        <p>
          <TooltipText content="Persistent notes for all gigs you are signed up to">General notes:</TooltipText>
        </p>
        <blockquote>{$userNotes || 'None'}</blockquote>
      {/if}
    </user-notes>
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
</gig-signup>
