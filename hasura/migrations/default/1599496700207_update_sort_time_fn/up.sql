drop function cucb.gig_time_or_arrive_time;
create function cucb.gig_time_or_arrive_time(gig_row cucb.gigs) returns timestamptz as $$
    select coalesce(gig_row.arrive_time, timezone('Etc/GMT', gig_row.date + gig_row.time), timezone('Etc/GMT', gig_row.date + time '00:00'))
$$ LANGUAGE sql STABLE;
