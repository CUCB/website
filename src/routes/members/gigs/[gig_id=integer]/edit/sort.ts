import type { Contact, GigContact, Venue } from "./types";

export function sortVenues(venues: Venue[]): Venue[] {
  return venues.sort(
    (a, b) => (a.name || "").localeCompare(b.name || "") || (a.subvenue || "").localeCompare(b.subvenue || ""),
  );
}

// TODO unit test
export function sortContacts(contacts: (Contact | GigContact)[]): void {
  contacts.sort((a, b) => {
    let contactA: Contact = "contact" in a ? a.contact : a;
    let contactB: Contact = "contact" in b ? b.contact : b;
    const compA = {
      name: contactA.name?.toLowerCase() || "",
      organization: contactA.organization?.toLowerCase() || "",
    };
    const compB = {
      name: contactB.name?.toLowerCase() || "",
      organization: contactB.organization?.toLowerCase() || "",
    };
    return compA.name < compB.name
      ? -1
      : compB.name < compA.name
      ? 1
      : compA.organization < compB.organization
      ? -1
      : compB.organization < compA.organization
      ? 1
      : 0;
  });
}
