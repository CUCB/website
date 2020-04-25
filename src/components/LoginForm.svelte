<script>
    import { stores } from '@sapper/app';

    let username, password;
    let error;
    const { page } = stores();

    async function submit() {
        const body = new URLSearchParams();
        body.append("username", username);
        body.append("password", password);

        let res = await fetch("/auth/login", {
            method: "post",
            body,
            headers: {
                "Content-type":
                    "application/x-www-form-urlencoded;charset=UTF-8"
            }
        });

        const isSuccessful = status => status >= 200 && status < 300;

        if (isSuccessful(res.status)) {
            // Reload the page so the session is up-to-date
            window.location.href = $page.path;
        } else if (res.status === 401) {
            error = await res.text();
        }
    }
</script>

<form on:submit|preventDefault="{submit}">
    <input type="text" bind:value="{username}" placeholder="Username" />
    <input type="password" bind:value="{password}" placeholder="Password" />
    <input type="submit" value="Login" />
</form>
{#if error}
    <p>{error}</p>
{/if}
