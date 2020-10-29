<script>
  import { onMount } from "svelte";
  import { makeTitle } from "../view";
  import HCaptcha from "../components/Global/HCaptcha.svelte";
  let name = "";
  let email = "";
  let lists = ["soc-cucb", "soc-cucb-chat", "soc-cucb-interested", "soc-cucb-alumni"].map(name => ({
    name,
    selected: false,
  }));
  let error;
  let captchaKey = undefined;
  let submitted = false;
  let success;

  let onCaptchaVerified = e => {
    console.log(e);
    captchaKey = e.detail.key;
  };

  async function submit() {
    console.log(captchaKey);
    error = undefined;
    if (!captchaKey) {
      error = "Please complete captcha";
      return;
    }
    const body = new URLSearchParams();
    body.append("name", name);
    body.append("email", email);
    body.append("lists", JSON.stringify(lists.filter(list => list.selected).map(list => list.name)));
    body.append("captchaKey", captchaKey);

    let res = await fetch("/mailinglists", {
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
  }
</script>

<style>
  form {
    width: 100%;
    max-width: 400px;
    align-items: stretch;
    box-sizing: border-box;
    margin: auto;
  }

  .checkbox {
    flex-direction: row;
    align-items: center;
  }
  .options {
    padding-left: 1em;
  }

  .error {
    color: var(--negative);
  }
</style>

<svelte:head>
  <title>{makeTitle('Mailing Lists')}</title>
</svelte:head>

<h1>Mailing lists</h1>
<h2>Keep up to date with CUCB</h2>

<p>CUCB runs four mailing lists:</p>
<ul>
  <li>
    The Official List (soc-cucb) provides official announcements, such as upcoming gigs, tours, socials and workshops.
    It is moderated.
  </li>
  <li>
    The Chat List (soc-cucb-chat) is used for all other emails regarding the band (or even things not involving the band
    but you want people to know about). This list is unmoderated (within reason).
  </li>
  <li>The Interested List (soc-cucb-interested) is for people interested in dancing at our public events.</li>
  <li>
    The Alumni List (soc-cucb-alumni) is for old members who have moved away from the area but would like to keep in
    contact with the band.
  </li>
</ul>

<h2>Join a list</h2>
{#if !submitted}
  <p>To join a list, please fill in the form below.</p>
  <form on:submit|preventDefault="{submit}">
    <label>
      Name
      <input type="text" required bind:value="{name}" />
    </label>
    <label>
      Email
      <input type="email" required bind:value="{email}" />
    </label>
    <p>I want to join:</p>
    <div class="options">
      {#each lists as list}
        <label class="checkbox">
          <input type="checkbox" bind:checked="{list.selected}" />
          {list.name}
        </label>
      {/each}
    </div>
    <HCaptcha on:verified="{onCaptchaVerified}" />
    <input type="submit" value="Submit" />
  </form>
{:else if success}
  Your request to join the list(s) has been sent to the webmaster and you will be added within 48 hours.
{/if}
{#if error}
  <span class="error">An error occured.</span>
  &ldquo;
  {@html error}
  &rdquo;
{/if}
