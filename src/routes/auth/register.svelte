<script context="module">
  export async function load({ session }) {
    if (session.userId !== undefined) {
      return {
        status: 302,
        redirect: "/members",
      };
    } else {
      return {};
    }
  }
</script>

<script>
  import { createValidityChecker, makeTitle, themeName, committee } from "../../view";
  import Mailto from "../../components/Mailto.svelte";
  import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";
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
        <li class="error" data-test="error">
          {@html error}
        </li>
      {/each}
    </ul>
  {/if}
  <label>First name <input type="text" bind:value="{firstName}" required="true" data-test="first-name" /></label>
  <label>Last name <input type="text" bind:value="{lastName}" required="true" data-test="last-name" /></label>
  <label for="username">CRSid/Email address
    <input
      id="username"
      bind:this="{fields.username}"
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
      bind:this="{fields.password}"
      use:checkValid="{{ validityErrors: { tooShort: 'Password should be at least 8 characters long' }, bothEqual: { id: 'password', error: 'Password and password confirmation do not match' } }}"
      bind:value="{password}"
      minlength="8"
      data-test="password"
      required="true"
    /></label>
  <label for="password-confirm">Confirm password<input
      id="password-confirm"
      bind:this="{fields.confirmPassword}"
      use:checkValid="{{ validityErrors: { tooShort: 'Password should be at least 8 characters long' }, bothEqual: { id: 'password', error: 'Password and password confirmation do not match' } }}"
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
