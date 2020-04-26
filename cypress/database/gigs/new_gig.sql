INSERT INTO cucb.gigs (id, title, type) VALUES (15274, 'Cypress Demo Gig', 1)
ON CONFLICT (id) DO UPDATE SET title=excluded.title, type=excluded.type
