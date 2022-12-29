<script lang="ts">
  import { DateTime } from "luxon";
  import type { User, Instrument } from "../../../routes/members/users/[id=integer]/types";

  export let user: User;
  function percentage(a: number, b: number): string {
    return `${Math.round((a / b) * 100)}%`;
  }

  function gigLink(id: string): string {
    return `/members/gigs/${id}`;
  }

  function possessive(name: string): string {
    return name + (name.endsWith("s") ? "'" : "'s");
  }

  function displayMonth(date: Date | null): string | null {
    if (date == null) return null;
    const luxonDate = DateTime.fromJSDate(date);
    return luxonDate.toFormat("MMMM yyyy");
  }

  function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function displayDate(date: Date | null | undefined): string | null {
    if (date == null) return null;
    const luxonDate = DateTime.fromJSDate(date);
    const day = luxonDate.day;
    return `${ordinal(day)} ${luxonDate.toFormat("MMMM yyyy")}`;
  }

  function countInstruments(instruments: Instrument[]): [Instrument, number][] {
    const idCounts = new Map();
    const instrumentsById = new Map();
    for (let instrument of instruments) {
      if (!instrumentsById.has(instrument.id)) {
        instrumentsById.set(instrument.id, instrument);
      }
      let currentCount = idCounts.get(instrument.id);
      idCounts.set(instrument.id, (currentCount || 0) + 1);
    }

    const result: [Instrument, number][] = [];
    for (let [id, count] of idCounts) {
      const instrument = instrumentsById.get(id);
      result.push([instrument, count]);
    }
    return result;
  }

  const join_date = user.joinDate ? `in ${displayMonth(user.joinDate)}` : "before records began";
  const login_date = user.lastLoginDate && `in ${displayMonth(user.lastLoginDate)}`;

  const last_gig = [...user.gig_lineups].reverse().find((x) => x.gig.date != null);
  const last_gig_date = displayDate(last_gig?.gig.date);
  const first_gig = user.gig_lineups?.[0];
  const first_gig_date = displayDate(first_gig?.gig.date);
  const gig_count = user.gig_lineups.length;
  const instrument_gig_count = user.gig_lineups.filter((gig) => gig.user_instruments.length > 0).length;

  const gig_instruments = user.gig_lineups
    .flatMap((x) => x.user_instruments)
    .map((instr) => instr.user_instrument.instrument);
  const counted_instruments: { instrument: Instrument; count: number }[] = countInstruments(gig_instruments).map(
    ([instrument, count]) => ({ instrument, count }),
  );

  // Sort most-played to least-played, then by alphabetical order if two instruments are played the same amount
  counted_instruments.sort((a, b) => b.count - a.count || a.instrument.name.localeCompare(b.instrument.name));
  const instrument_count = counted_instruments.length;
  const [most_played_instrument, ...other_instruments] = counted_instruments;
</script>

<p>
  Say hi to
  <b>{user.first} {user.last}</b>!
  {user.first}
  joined the site
  {join_date}
  and
  {#if login_date}was last seen online {login_date}.{:else}hasn't been seen in a long time.{/if}
</p>

{#if gig_count > 0 && last_gig}
  Since joining CUCB,
  {user.first}
  has played
  {gig_count}
  {gig_count > 1 ? "gigs" : "gig"}
  {#if gig_count > 1}, most recently{/if}
  on the
  <a href="{gigLink(last_gig.gig.id)}">{last_gig_date}</a>.
  {#if gig_count > 1}The first one was back on the <a href="{gigLink(first_gig.gig.id)}">{first_gig_date}</a>.{/if}

  {#if instrument_count > 0}
    {possessive(user.first)}
    instrument of choice would seem to be
    <b>{most_played_instrument.instrument.name}</b>, having played it in
    {percentage(most_played_instrument.count, instrument_gig_count)}
    of their gigs.
    {#if instrument_count > 1}
      Apart from that, they have been known to play
      {#each other_instruments as instrument, i}
        <b>
          {instrument.instrument.name}{#if instrument.instrument.novelty}*{/if}
        </b>
        {#if i < other_instruments.length - 1}/{/if}
      {/each}.
    {/if}
    {#if counted_instruments.find((i) => i.instrument.novelty)}
      <p>[*] We don't always take ourselves too seriously.</p>
    {/if}
  {/if}
{/if}
