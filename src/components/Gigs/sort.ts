const instrumentsLeadersFirst = (
  leaderInstruments: Set<string>,
): ((a: LineupInstrument, b: LineupInstrument) => number) => {
  return (a, b) =>
    leaderInstruments.has(a.user_instrument.instrument.id)
      ? leaderInstruments.has(b.user_instrument.instrument.id)
        ? 0
        : -1
      : leaderInstruments.has(b.user_instrument.instrument.id)
      ? 1
      : 0;
};

const instrumentsByRank = (a: LineupInstrument, b: LineupInstrument): number => {
  const tuneInstruments = ["Recorder(s)", "Low Whistle(s)", "Fiddle", "Whistle(s)", "Flute", "High Whistle(s)"].sort();
  const rhythmInstruments = ["Bass Guitar", "Bodhran", "Guitar", "Mandolin"].sort();
  const tuneIndexA = tuneInstruments.indexOf(a.user_instrument.instrument.name);
  const tuneIndexB = tuneInstruments.indexOf(b.user_instrument.instrument.name);
  const rhythmIndexA = rhythmInstruments.indexOf(a.user_instrument.instrument.name);
  const rhythmIndexB = rhythmInstruments.indexOf(b.user_instrument.instrument.name);
  const compareTune = (a: number, b: number): number => (a !== -1 ? (b !== -1 ? a - b : -1) : b !== -1 ? 1 : 0);
  const compareRhythm = (a: number, b: number): number => (a !== -1 ? (b !== -1 ? a - b : 1) : b !== -1 ? -1 : 0);
  return tuneIndexA !== -1 || tuneIndexB !== -1
    ? compareTune(tuneIndexA, tuneIndexB)
    : rhythmIndexA !== -1 || rhythmIndexB !== -1
    ? compareRhythm(rhythmIndexA, rhythmIndexB)
    : a.user_instrument.instrument.name.localeCompare(b.user_instrument.instrument.name);
};

const peopleLeadersFirst = (a: LineupEntry, b: LineupEntry): number =>
  a.leader ? (b.leader ? peopleByInstrumentRank(a, b) : -1) : b.leader ? 1 : 0;
const peopleByInstrumentRank = (a: LineupEntry, b: LineupEntry): number =>
  a.user_instruments.length > 0 && a.user_instruments[0]
    ? b.user_instruments.length > 0 && b.user_instruments[0]
      ? instrumentsByRank(a.user_instruments[0], b.user_instruments[0])
      : -1
    : b.user_instruments.length > 0 && b.user_instruments[0]
    ? 1
    : 0;
const peopleByLeaderInstrument =
  (leaderInstruments: Set<string>) =>
  (a: LineupEntry, b: LineupEntry): number =>
    a.user_instruments.length > 0 && a.user_instruments[0]
      ? b.user_instruments.length > 0 && b.user_instruments[0]
        ? leaderInstruments.has(a.user_instruments[0].user_instrument?.instrument?.id)
          ? leaderInstruments.has(b.user_instruments[0].user_instrument?.instrument?.id)
            ? 0
            : -1
          : leaderInstruments.has(b.user_instruments[0].user_instrument?.instrument?.id)
          ? 1
          : 0
        : -1
      : b.user_instruments.length > 0 && b.user_instruments[0]
      ? 1
      : 0;

// TODO typescript because debugging why this wasn't working for my list was a pain!

interface LineupEntry {
  leader: boolean;
  user_instruments: LineupInstrument[];
}

interface LineupInstrument {
  user_instrument: UserInstrument;
}

interface UserInstrument {
  instrument: {
    id: string;
    name: string;
  };
}

export const sortLineup = (lineup: LineupEntry[]): LineupEntry[] => {
  const leaderInstruments = new Set(
    lineup
      .filter((x) => x.leader)
      .flatMap((x) => x.user_instruments)
      .map((i) => i.user_instrument.instrument.id),
  );
  for (let person of lineup) {
    person.user_instruments.sort(instrumentsByRank).sort(instrumentsLeadersFirst(leaderInstruments));
  }
  lineup.sort(peopleByInstrumentRank).sort(peopleByLeaderInstrument(leaderInstruments)).sort(peopleLeadersFirst);
  return lineup;
};
