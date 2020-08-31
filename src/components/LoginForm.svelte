<script>
  export let redirectTo;

  let username = "";
  let password = "";
  let error;

  let updateProps = [
    "accent_light",
    "accent_dark",
    "accent_default",
    "color",
    "logo_light",
    "logo_dark",
    "logo_default",
    "spinnyLogo",
  ];
  const updateSessionTheme = userId => {
    let theme = new URLSearchParams();
    for (let prop of updateProps) {
      let value = localStorage.getItem(`${prop}_${userId}`);
      if (value) theme.append(prop, value);
    }
    return fetch("/updatetheme", {
      method: "POST",
      body: theme,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });
  };

  async function submit() {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    let res = await fetch("/auth/login", {
      method: "post",
      body,
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    });

    const isSuccessful = status => status >= 200 && status < 300;

    if (isSuccessful(res.status)) {
      // Set theme from localstorage
      await updateSessionTheme(await res.text());
      // Reload the page so the session is up-to-date
      window.location.href = redirectTo;
    } else {
      error = await res.text();
    }
  }
</script>

<h1>Sign in</h1>
<form on:submit|preventDefault="{submit}">
  <label>
    Username
    <input type="text" bind:value="{username}" data-test="username" />
  </label>
  <label>
    Password
    <input type="password" bind:value="{password}" data-test="password" />
  </label>
  <input type="submit" value="Login" data-test="submit" />
</form>
Don't have an account already?
<a href="/auth/register" data-test="register">Click here</a>
to sign up to the website.
<ul data-test="errors">
  {#if error}
    <li>{error}</li>
  {/if}
</ul>
