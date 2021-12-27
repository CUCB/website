<script lang="ts" context="module">
  import type { LoadInput, LoadOutput } from "@sveltejs/kit";
  import { currentUser } from "../../../graphql/user";
  import { makeClient } from "../../../graphql/client";
  import { makeTitle } from "../../../view";

  interface User {
    id: number;
    first: string;
    last: string;
    bio: string | null;
    bio_changed_date: Date | null;
    last_login_date: Date | null;
    join_date: Date | null;
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
          date: Date | null;
          venue: {
            name: string;
            subvenue: string | null;
          };
        };
        user_instruments: [
          {
            user_instrument: {
              instrument: {
                name: string;
              };
            };
          },
        ];
      },
    ];
  }

  export async function load({ page, session, fetch }: LoadInput): Promise<LoadOutput> {
    const {
      params: { id },
    } = page;
    if (id === session.userId) {
      const clientCurrentUser = makeClient(fetch, {
        role: "current_user",
      });
      const res = await clientCurrentUser.query<{ cucb_users_by_pk: User }>({
        query: currentUser,
        variables: { id },
      });
      return { props: { user: res.data.cucb_users_by_pk } };
    } else {
      const client = makeClient(fetch);
      const res = await client.query<{ cucb_users_by_pk: User }>({
        query: currentUser,
        variables: { id },
      });
      if (res.data.cucb_users_by_pk) {
        return { props: { user: res.data.cucb_users_by_pk } };
      } else {
        return { status: 404, error: "User not found" };
      }
    }
  }
</script>

<script lang="ts">
  import Mailto from "../../../components/Mailto.svelte";

  export let user: User;

  function displayDate(date: Date | null): string | null {
    if (date == null) return null;
    return date.toString();
  }

  function possessive(name: string): string {
    return name.endsWith("s") ? "'" : "'s";
  }

  function countInstruments(names: string[]): Map<string, number> {
    const map = new Map();
    for (let name of names) {
      let currentCount = map.get(name);
      map.set(name, (currentCount || 0) + 1);
    }
    return map;
  }

  function percentage(a: number, b: number): string {
    return `${Math.round((a / b) * 100)}%`;
  }

  function gigLink(id: number): string {
    return `/members/gigs/${id}`;
  }

  const join_date = displayDate(user.join_date) || "before records began";
  const login_date = displayDate(user.last_login_date);

  const last_gig = [...user.gig_lineups].reverse().find((x) => x.gig.date != null);
  const last_gig_date = displayDate(last_gig?.gig.date);
  const first_gig = user.gig_lineups?.[0];
  const first_gig_date = displayDate(first_gig?.gig.date);
  const gig_count = user.gig_lineups.length;
  const instrument_gig_count = user.gig_lineups.filter((gig) => gig.user_instruments.length > 0).length;

  const instrument_names = user.gig_lineups
    .flatMap((x) => x.user_instruments)
    .map((instr) => instr.user_instrument.instrument.name);
  // TODO tidy this into an object[] so we have sensibly named fields rather than 0 and 1
  const counted_instruments: [string, number][] = [...countInstruments(instrument_names).entries()];
  // Sort most-played to least-played, then by alphabetical order if two instruments are played the same amount
  counted_instruments.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const instrument_count = counted_instruments.length;
  const [most_played_instrument, ...other_instruments] = counted_instruments;

  let has_polo = user.prefs.find((pref) => pref.pref_type.name == "attribute.tshirt")?.value;
  let has_folder = user.prefs.find((pref) => pref.pref_type.name == "attribute.folder")?.value;
  let is_driver = user.prefs.find((pref) => pref.pref_type.name == "attribute.driver")?.value;
  let has_car = user.prefs.find((pref) => pref.pref_type.name == "attribute.car")?.value;
  let can_lead = user.prefs.find((pref) => pref.pref_type.name == "attribute.leader")?.value;
  let can_tech = user.prefs.find((pref) => pref.pref_type.name == "attribute.soundtech")?.value;
  let newPassword = "";
  let newPasswordConfirm = "";
</script>

<style>
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
</style>

<svelte:head>
  <title>{makeTitle(`${user.first} ${user.last}`)}</title>
</svelte:head>

{#if user.bio}
  <figure>
    <blockquote>{user.bio}</blockquote>
    <figcaption>{user.first}</figcaption>
  </figure>
{:else}
  <blockquote class="empty">No bio written yet!</blockquote>
{/if}

<p>
  Say hi to
  <b>{user.first} {user.last}</b>!
  {user.first}
  joined the site
  {join_date}
  and
  {#if login_date}was last seen online in {login_date}.{:else}hasn't been seen in a long time.{/if}
</p>

<!-- TODO support the "[*] We don't always take ourselves too seriously." footnote where novelty instruments are used -->

{#if gig_count > 0}
  Since joining CUCB,
  {user.first}
  has played
  {gig_count}
  {gig_count > 1 ? 'gigs' : 'gig'},
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
        {#each other_instruments as instrument, i}
          {other_instruments[0]}
          {#if i < other_instruments.length - 1}/{/if}
        {/each}
      </b>
    {/if}
  {/if}
{/if}

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
      value="{user.last_login_date.toString().replace(/:\d{2}\.\d{6}\+.*/, '')}"
    />

    <label for="join-date">Joined</label><input
      type="{user.join_date ? 'date' : 'text'}"
      disabled
      id="join-date"
      value="{user.join_date ? user.join_date.toDateString() : '?'}"
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
