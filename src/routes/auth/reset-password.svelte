<script context="module" lang="ts">
  import type { Preload } from "@sapper/common";

  export const preload: Preload = async function (_, session) {
    if (session.userId !== undefined) {
      this.redirect(302, "/members");
    }
  };
</script>

<script lang="ts">
  import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";
  import { committee, createValidityChecker } from "../../view";
  import HCaptcha from "../../components/Global/HCaptcha.svelte";
  import Mailto from "../..//components/Mailto.svelte";

  const regexString = (regexp: RegExp) => regexp.toString().slice(1, regexp.toString().length - 1);
  const checkValid = createValidityChecker();

  let usernameField: HTMLElement;
  let username: string;
  let error: string | undefined = undefined;
  let captchaKey: string | undefined = undefined;
  let success: boolean = false;

  async function submit() {
    if (!captchaKey) {
      error = "Please complete captcha";
      return;
    }
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("captchaKey", captchaKey);

    let res = await fetch("/auth/reset-password", {
      method: "POST",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    const isSuccessful = (status: number) => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      success = true;
      error = undefined;
    } else {
      success = false;
      error = await res.text();
    }
  }
</script>

<h1>Reset password</h1>

<p>
  If you've forgotten your password, enter your CRSid or email below and click the button to be emailed a magic reset
  link.
</p>

{#if error}
  <p class="error" data-test="error">{error}</p>
{/if}

{#if !success}
  <form on:submit|preventDefault="{submit}">
    <label>Email/CRSid
      <input
        id="username"
        bind:this="{usernameField}"
        type="text"
        bind:value="{username}"
        data-test="username"
        use:checkValid="{{ validityErrors: { patternMismatch: 'This should be either a CRSid or an email address' } }}"
        pattern="{regexString(CRSID_PATTERN)}|{regexString(EMAIL_PATTERN)}"
        required="{true}"
      /></label>
    <HCaptcha on:verified="{(e) => (captchaKey = e.detail.key)}" />
    <input type="submit" value="Reset password" />
  </form>
{:else}
  <p>
    A pasword reset link has been generated and emailed to you. If you can no longer access the email address you are
    signed up to the website with,
    <Mailto person="{$committee.webmaster}">email the webmaster</Mailto>
    who will be able to help you.
  </p>
{/if}
