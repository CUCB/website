<script context="module" lang="ts">
  import type { Preload } from "@sapper/common";
  import { Number } from "runtypes";
  const isSuccessful = (status: number) => status >= 200 && status < 300;

  type PreloadResponse =
    | { valid: true; token: string }
    | { valid: false; token: undefined }
    | { valid: null; token: undefined };
  export const preload: Preload = async function ({ query }, session): Promise<{ preload: PreloadResponse }> {
    if (session.userId !== undefined) {
      this.redirect(302, "/members");
    }

    const token = query["token"];

    if (token && typeof token === "string") {
      const res = await this.fetch(`/auth/reset-password/verify/${token}`);
      if (isSuccessful(res.status)) {
        const body = await res.json();
        if (Number.guard(body.id)) {
          return { preload: { valid: true, token } };
        } else {
          return { preload: { valid: false, token: undefined } };
        }
      } else {
        return { preload: { valid: false, token: undefined } };
      }
    } else {
      return { preload: { valid: null, token: undefined } };
    }
  };
</script>

<script lang="ts">
  import { EMAIL_PATTERN, CRSID_PATTERN } from "./_register";
  import { committee, createValidityChecker } from "../../view";
  import Mailto from "../../components/Mailto.svelte";

  const regexString = (regexp: RegExp) => regexp.toString().slice(1, regexp.toString().length - 1);
  const checkValid = createValidityChecker();

  export let preload: PreloadResponse;
  let { validToken, token } = { validToken: preload.valid, token: preload.token };

  let username: string | undefined;
  let password: string;
  let passwordConfirm: string;
  let error: string | undefined = undefined;
  let success: boolean = false;

  const submit = (url: "start" | "complete") => async (_: Event): Promise<void> => {
    const body = new URLSearchParams();
    if (typeof username !== "undefined") {
      body.append("username", username);
    } else if (typeof password !== "undefined" && typeof token !== "undefined") {
      if (password !== passwordConfirm) {
        error = "Passwords do not match";
        return;
      }
      body.append("password", password);
      body.append("token", token);
    } else {
      // TODO error
    }

    let res = await fetch(`/auth/reset-password/${url}`, {
      method: "POST",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    if (isSuccessful(res.status)) {
      success = true;
      error = undefined;
    } else {
      success = false;
      error = await res.text();
    }
  };
</script>

<h1>Reset password</h1>

{#if error}
  <p class="error" data-test="error">{error}</p>
{/if}

{#if validToken === null}
  <p>
    If you've forgotten your password, enter your CRSid or email below and click the button to be emailed a magic reset
    link.
  </p>
  {#if !success}
    <form on:submit|preventDefault="{submit('start')}">
      <label>Email/CRSid
        <input
          id="username"
          type="text"
          bind:value="{username}"
          data-test="username"
          use:checkValid="{{ validityErrors: { patternMismatch: 'This should be either a CRSid or an email address' } }}"
          pattern="{regexString(CRSID_PATTERN)}|{regexString(EMAIL_PATTERN)}"
          required="{true}"
        /></label>
      <input type="submit" value="Reset password" data-test="submit" />
    </form>
  {:else}
    <p>
      A pasword reset link has been generated and emailed to you. If you can no longer access the email address you are
      signed up to the website with,
      <Mailto person="{$committee.webmaster}">email the webmaster</Mailto>
      who will be able to help you.
    </p>
  {/if}
{:else if validToken}
  <p>Please enter your chosen password below, and click the button to set your new password.</p>
  {#if !success}
    <form on:submit|preventDefault="{submit('complete')}">
      <label>Password<input
          type="password"
          data-test="password"
          bind:value="{password}"
          use:checkValid="{{ bothEqual: { id: 'password', error: 'Passwords do not match' } }}"
          required="{true}"
        /></label>
      <label>Confirm password<input
          type="password"
          data-test="password-confirm"
          bind:value="{passwordConfirm}"
          use:checkValid="{{ bothEqual: { id: 'password', error: 'Passwords do not match' } }}"
          required="{true}"
        /></label>
      <input type="submit" value="Change password" data-test="submit" />
    </form>
  {:else}
    <p>Your password has been successfully reset. Please <a href="/auth/login" data-test="login-link">click here</a> to login with it.</p>
  {/if}
{:else}
  <!-- TODO better error messages based on what actually went wrong -->
  <p>This password reset URL has expired, please <a href="/auth/reset-password">click here</a> to try again.</p>
{/if}
