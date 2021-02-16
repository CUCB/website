<script>
  import { createValidityChecker, makeTitle, themeName, committee } from "../../view";
  import Mailto from "../../components/Mailto.svelte";
  // TODO stick these somewhere to be re-used
  export const EMAIL_PATTERN = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  export const CRSID_PATTERN = /[A-z]{2,6}[0-9]{1,6}/;
  let fields = {};
  let checkValid = createValidityChecker();

  let firstName, lastName, username, password, passwordConfirm;
  firstName = lastName = username = password = passwordConfirm = "";
  let submitted = false;
  const regexString = (regexp) => regexp.toString().slice(1, regexp.toString().length - 1);
  let errors = [];

  async function submit() {
    for (let field of Object.values(fields).filter((x) => x)) {
      field.dispatchEvent(new Event("change"));
      if (field.checkValidity && !field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    const body = new URLSearchParams();
    body.append("firstName", firstName);
    body.append("lastName", lastName);
    body.append("username", username);
    body.append("password", password);
    body.append("passwordConfirm", passwordConfirm);

    let res = await fetch("/auth/register", {
      method: "post",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    const isSuccessful = (status) => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      // Reload the page so the session is up-to-date
      window.location.href = "/members";
    } else {
      errors = [await res.text()];
    }
  }
</script>

<style lang="scss">
  @import "../../sass/themes.scss";
  form:not(.submitted) :invalid {
    box-shadow: none;
    &:focus {
      @include themeify($themes) {
        box-shadow: 0px 0px 4px 1px themed("accent");
      }
      box-shadow: 0px 0px 4px 1px var(--accent);
    }
  }

  dt {
    font-weight: bold;
  }
</style>

<svelte:head>
  <title>{makeTitle('Create an account')}</title>
</svelte:head>

<h1>Create an account</h1>

<p>To register, you must be on the main band email list (soc-cucb).</p>

<p>If you are not, please sign up <a data-test="mailinglists" href="/mailinglists">here</a>.</p>

<p>
  If you have any problems at all, please feel free to ask a friendly webmaster &mdash;
  <Mailto person="{$committee.webmaster}">{$committee.webmaster.name}</Mailto>!
</p>

<form on:submit|preventDefault="{submit}" class:submitted class="theme-{$themeName}">
  {#if errors.length > 0}
    <ul class="errors" data-test="errors">
      {#each errors as error}
        <li class="error" data-test="error">{error}</li>
      {/each}
    </ul>
  {/if}
  <label>First name <input type="text" bind:value="{firstName}" required="true" data-test="first-name" /></label>
  <label>Last name <input type="text" bind:value="{lastName}" required="true" data-test="last-name" /></label>
  <label for="username">CRSid/Email address
    <input
      id="username"
      bind:this={fields.username}
      type="text"
      bind:value="{username}"
      data-test="username"
      use:checkValid="{{ validityErrors: { patternMismatch: 'This should be either a CRSid or an email address' } }}"
      pattern="{regexString(CRSID_PATTERN)}|{regexString(EMAIL_PATTERN)}"
      required="true"
    />
  </label>
  <label for="password">Password<input
      type="password"
      use:checkValid="{{ validityErrors: { tooShort: 'Password should be at least 8 characters long' }, bothEqual: { id: 'password', error: 'Password and password confirmation do not match' } }}"
      bind:this={fields.password}
      bind:value="{password}"
      minlength="8"
      data-test="password"
      required="true"
    /></label>
  <label for="password-confirm">Confirm password<input
      id="password-confirm"
      use:checkValid="{{ bothEqual: { id: 'password', error: 'Password and password confirmation do not match' } }}"
      bind:this={fields.confirmPassword}
      type="password"
      bind:value="{passwordConfirm}"
      data-test="password-confirm"
      required="true"
    /></label>
  <input type="submit" value="Register" />
</form>
<dl>
  <dt>Name</dt>
  <dd>Fill in your first and last name so you can be identified on the site.</dd>
  <dt>CRSID</dt>
  <dd>
    Enter your crsid (e.g. abc12) without the '@cam.ac.uk'. If you do not have a CRSID, please use your full email
    address, the one at which you receive CUCB email
  </dd>
  <dt>Password</dt>
  <dd>
    Please select a memorable password of at least 6 letters or numbers. Retype it in the second box to make sure it
    wasn't mistyped. For security reasons the form does not memorise your password, so please enter it as the last thing
    before pressing submit
  </dd>
</dl>
