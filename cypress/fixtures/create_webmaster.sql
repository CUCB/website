INSERT INTO cucb.users (id, username, salted_password, admin, email, first, last) VALUES (1, 'cypress', '$2b$10$fsfeK3cSN/04rNTVm3dkNuKaaFzo/Xj6HBBzgi1uooabY7XX1vABq', 1, 'cy@press.io', 'Cypress', 'Webmaster')
ON CONFLICT (id) DO UPDATE set username=excluded.username, salted_password=excluded.salted_password, email=excluded.email, first=excluded.first, last=excluded.last
