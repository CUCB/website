
CREATE FUNCTION cucb.user_prefs_or_default(user_row cucb.users)
RETURNS SETOF cucb.user_prefs AS $$
    SELECT user_row.id as user_id,
      user_pref_types.id as pref_id,
      COALESCE(user_prefs.value, user_pref_types.default) AS value
    FROM cucb.user_pref_types
    LEFT JOIN cucb.user_prefs ON (user_prefs.pref_id = user_pref_types.id AND user_row.id = user_prefs.user_id)
$$ LANGUAGE sql STABLE;