<script>
  import { committee, makeTitle, themeName } from "../view";
  import HCaptcha from "../components/Global/HCaptcha.svelte";
  import Mailto from "../components/Mailto.svelte";
  let name = "";
  let email = "";
  let lists = ["soc-cucb", "soc-cucb-chat", "soc-cucb-interested", "soc-cucb-alumni"].map((name) => ({
    name,
    selected: false,
  }));
  let error;
  let captchaKey = undefined;
  let submitted = false;
  let success;

  let onCaptchaVerified = (e) => {
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
    body.append("lists", JSON.stringify(lists.filter((list) => list.selected).map((list) => list.name)));
    body.append("captchaKey", captchaKey);

    let res;
    try {
      res = await fetch("/mailinglists", {
        method: "POST",
        body,
        headers: {
          "Content-type": "multipart/form-data;charset=UTF-8",
        },
      });
    } catch (e) {
      console.error(e);
      return;
    }

    const isSuccessful = (status) => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      success = true;
    } else {
      success = false;
      error = await res.text();
    }
    submitted = true;
  }
</script>

<style lang="scss">
  @import "../sass/themes.scss";

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
    @include themeifyThemeElement($themes) {
      color: themed("negative");
    }
  }

  input:invalid {
    box-shadow: none;
    &:focus {
      box-shadow: 0px 0px 4px 1px var(--accent);
    }
  }
</style>

<svelte:head>
  <title>{makeTitle('Mailing Lists')}</title>
  <noscript>
    {@html `<style` + `>.how-to {display: none}</` + `style>`}
  </noscript>
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
<section class="how-to">
  {#if !submitted}
    <p>
      To join a list, please fill in the form below, or
      <Mailto person="{$committee.webmaster}">email the webmaster</Mailto>
      with your name and the name(s) of the list(s) you would like to sign up to.
    </p>
    <form on:submit|preventDefault="{submit}">
      <label> Name <input type="text" required bind:value="{name}" /> </label>
      <label> Email <input type="email" required bind:value="{email}" /> </label>
      <p>I want to join:</p>
      <div class="options">
        {#each lists as list}
          <label class="checkbox"> <input type="checkbox" bind:checked="{list.selected}" /> {list.name} </label>
        {/each}
      </div>
      <HCaptcha on:verified="{onCaptchaVerified}" />
      <input type="submit" value="Submit" />
    </form>
  {:else if success}
    Your request to join the list(s) has been sent to the webmaster and you will be added within 48 hours.
  {/if}
  {#if error}
    <span class="error theme-{$themeName}">An error occured.</span>
    &ldquo;
    {@html error}
    &rdquo;
  {/if}
</section>
<noscript>
  To join a mailing list, please
  <Mailto person="{$committee.webmaster}">email the webmaster</Mailto>
  with your name, email address and the name(s) of the list(s) you would like to join.
</noscript>
