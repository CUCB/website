<script>
  import { onMount } from "svelte";
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
  let captchaVisible = false;

  let enableCaptcha = () => {
    captchaKey = undefined;
    captchaVisible = true;
  };

  let onCaptchaVerified = e => {
    captchaKey = e.key;
  };

  onMount(async () => {
    await import("vanilla-hcaptcha");
    enableCaptcha();
  });

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
      method: "post",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    const isSuccessful = status => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      message = "Your message was sent successfully";
      name = "";
      email = "";
      bookingEnquiry = false;
      dates = "";
      times = "";
      venue = "";
      message = "";
      occasion = "";
    } else {
      error = await res.text();
    }
  }
</script>

<style>
  label {
    cursor: pointer;
    user-select: none;
  }

  form {
    width: 100%;
    max-width: 400px;
    align-items: stretch;
    box-sizing: border-box;
  }

  label.checkbox {
    display: inline;
  }

  p {
    font-style: italic;
  }

  .error {
    color: var(--negative);
  }
</style>

<h2>Contact us</h2>
<form on:submit|preventDefault="{submit}">
  <label>
    Your name
    <input type="text" bind:value="{name}" required />
  </label>
  <label>
    Your e-mail address
    <input type="email" bind:value="{email}" required />
  </label>
  <label class="checkbox">
    Interested in booking us?
    <input type="checkbox" bind:checked="{bookingEnquiry}" />
  </label>
  {#if bookingEnquiry}
    <p>
      It would be very helpful if you could tell us as much as you can about the event now. Don't worry if you don't
      have details yet, but please do provide what information you can. Similarly, include any further details in the
      message.
    </p>
    <label>
      Occasion/Event
      <select required bind:value="{occasion}">
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
      <input type="text" bind:value="{dates}" />
    </label>
    <label>
      Suggested times
      <input type="text" bind:value="{times}" />
    </label>
    <label>
      Suggested venue
      <input type="text" bind:value="{venue}" />
    </label>
  {/if}

  <label>
    Message
    <textarea bind:value="{message}" rows="{15}" required></textarea>
  </label>

  {#if captchaVisible}
    <h-captcha
      id="captcha"
      site-key="{process.env.HCAPTCHA_SITE_KEY}"
      size="normal"
      dark
      on:verified="{onCaptchaVerified}"
    ></h-captcha>
  {/if}

  <input type="submit" value="Send" />
</form>
{#if error}
  <span class="error">{error}</span>
{/if}
