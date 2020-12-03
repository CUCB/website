<script>
  import { createEventDispatcher } from "svelte";
  import { themeName } from "../view";
  import HCaptcha from "./Global/HCaptcha.svelte";
  let name = "";
  let email = "";
  let bookingEnquiry = false;
  let dates = "";
  let times = "";
  let venue = "";
  let message = "";
  let occasion = "";
  let error;
  let captchaKey = undefined;
  let submitted = false;
  let success;

  const dispatch = createEventDispatcher();

  let onCaptchaVerified = e => {
    captchaKey = e.detail.key;
  };

  async function submit() {
    error = undefined;
    if (!captchaKey) {
      error = "Please complete captcha";
      return;
    }
    const body = new URLSearchParams();
    body.append("name", name);
    body.append("email", email);
    body.append("bookingEnquiry", JSON.stringify(bookingEnquiry));
    body.append("dates", dates);
    body.append("times", times);
    body.append("venue", venue);
    body.append("message", message);
    body.append("occasion", occasion);
    body.append("captchaKey", captchaKey);

    let res = await fetch("/contact", {
      method: "POST",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    const isSuccessful = status => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      success = true;
    } else {
      success = false;
      error = await res.text();
    }
    submitted = true;
    dispatch("complete");
  }
</script>

<style lang="scss">
  @import "../sass/themes.scss";

  label {
    cursor: pointer;
    user-select: none;
  }

  form {
    width: 100%;
    max-width: 400px;
    align-items: stretch;
    box-sizing: border-box;
    margin: auto;
  }

  label.checkbox {
    flex-direction: row;
    align-items: center;
  }

  .note {
    font-style: italic;
  }

  .error {
    @include themeifyThemeElement($themes) {
      color: themed("negative");
    }
  }
</style>

{#if !submitted}
  <form on:submit|preventDefault="{submit}">
    <label>
      Your name
      <input type="text" bind:value="{name}" required data-test="booking-name" />
    </label>
    <label>
      Your e-mail address
      <input type="email" bind:value="{email}" required data-test="booking-email" />
    </label>
    <label class="checkbox">
      Interested in booking us?
      <input type="checkbox" bind:checked="{bookingEnquiry}" data-test="booking-enquiry" />
    </label>
    {#if bookingEnquiry}
      <p class="note">
        It would be very helpful if you could tell us as much as you can about the event now. Don't worry if you don't
        have details yet, but please do provide what information you can. Similarly, include any further details in the
        message.
      </p>
      <label>
        Occasion/Event
        <select required bind:value="{occasion}" data-test="booking-occasion">
          <option value="" disabled selected>Select one</option>
          <option value="Fundraiser">Fundraiser</option>
          <option value="Wedding">Wedding</option>
          <option value="Private party">Private party</option>
          <option value="Corporate event">Corporate event</option>
          <option value="College JCR/MCR event">College JCR/MCR event</option>
          <option value="College ball or similar event">College ball or similar event</option>
          <option value="Other">Other (please give details below)</option>
        </select>
      </label>

      <label>
        Suggested dates
        <input type="text" bind:value="{dates}" data-test="booking-dates" />
      </label>
      <label>
        Suggested times
        <input type="text" bind:value="{times}" data-test="booking-times" />
      </label>
      <label>
        Suggested venue
        <input type="text" bind:value="{venue}" data-test="booking-venue" />
      </label>
    {/if}

    <label>
      Message
      <textarea bind:value="{message}" rows="{15}" required data-test="booking-message"></textarea>
    </label>

    <HCaptcha on:verified="{onCaptchaVerified}" />

    {#if error}
      <span class="error theme-{$themeName}">{error}</span>
    {/if}
    <input type="submit" value="Send" data-test="booking-send" />
  </form>
{:else if success}
  <p>Thank you, {name}&nbsp;({email})!</p>

  <p>
    Your message has been sent to our secretary, and a confirmation message sent to your address. (If you do not receive
    this within a few hours, please check your e-mail was entered correctly and contact the secretary directly by
    e-mail.)
  </p>
{:else}
  <p>
    <span class="error">An error occurred.</span>
    The error message was: &ldquo;
    {@html error}
    &rdquo;
  </p>
{/if}
