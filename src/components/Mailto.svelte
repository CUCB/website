<script>
  export let person;
  let email = person.email_obfus;
  $: subject = email.match(/_/) ? "Remove underscores from email address" : "";
  $: encodedSubject = subject.replace(/ /g, "%20");
  $: mailto = `mailto:${email}?subject=${encodedSubject}`;

  const removeUnderscores = () => {
    email = email.replace(/_/g, "");
  };
</script>

<a
  href="{mailto}"
  on:focus="{removeUnderscores}"
  on:mouseover="{removeUnderscores}"
  data-test="{`email_${person.committee_key.name}`}"
>
  <slot />
</a>
