export const AllInstrumentNames = `
    query AllInstrumentNames {
        cucb_instruments {
            id
            name
        }
    }
`;

export const OnConflictUserInstruments = {
  constraint: "cucb_users_instruments_id_key",
  update_columns: ["deleted", "instr_id", "nickname", "user_id"],
};

export const OnConflictLineupInstruments = {
  constraint: "gigs_lineups_instruments_pkey",
  update_columns: ["approved"],
};
