INSERT INTO cucb.users (id, username, salted_password, admin, email, first, last) VALUES (2, 'cypress_user', '$2b$10$fsfeK3cSN/04rNTVm3dkNuKaaFzo/Xj6HBBzgi1uooabY7XX1vABq', 9, 'cyuser@press.io', 'Cypress', 'User')
ON CONFLICT (id) DO UPDATE set username=excluded.username, salted_password=excluded.salted_password, email=excluded.email, first=excluded.first, last=excluded.last
