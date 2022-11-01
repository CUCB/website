export function sortVenues(venues): void {
  return venues.sort(
    (a, b) => (a.name || "").localeCompare(b.name || "") || (a.subvenue || "").localeCompare(b.subvenue || ""),
  );
}

export function sortContacts(contacts): void {
  contacts.sort((a, b) => {
    a = a.contact ? a.contact : a;
    b = b.contact ? b.contact : b;
    a = { name: a.name && a.name.toLowerCase(), organization: a.organization && a.organization.toLowerCase() };
    b = { name: b.name && b.name.toLowerCase(), organization: b.organization && b.organization.toLowerCase() };
    return a.name < b.name
      ? -1
      : b.name < a.name
      ? 1
      : a.organization < b.organization
      ? -1
      : b.organization < a.organization
      ? 1
      : 0;
  });
}
