# CUCB Website

This is the new rewrite of the CUCB website, which uses [SvelteKit](https://kit.svelte.dev) to do the frontend, and [hasura](https://hasura.io/) for the backend.

## Dependencies

- [Node.js and npm](https://nodejs.org/en/download/) (node package manager)
- [Docker and docker-compose](https://www.docker.com/products/docker-desktop) - on Ubuntu use `sudo apt install docker docker-compose`
- [Visual studio code](https://code.visualstudio.com/) (or [VSCodium](https://github.com/VSCodium/vscodium)) - an editor with good support from svelte via an extension. There is config in the repository to help you get set up.

### Installing on Windows

For some tips on how to get best set up if you're running Windows, see [the relevant page on the wiki](https://github.com/CUCB/website/wiki/How-to-Windows).

## Getting started

1. Clone the repository
2. Install the recommended extensions. Press `ctrl+shift+p` (or probably `cmd+shift+p` on Mac) and search for "show recommended extensions" (without the quotes) and press enter to select the option that appears. Install all the extensions under the heading "Workspace recommended extensions".
3. Run `npm install`. This will install the dependencies locally, including Cypress (the test runner), hasura-cli (which is used to manage database migrations), prettier (a code formatter), and a git hook via husky (which will format the code with prettier when making a git commit)
4. Run `npm run docker:start` (in VSCode, this should be possible by just pressing Ctrl+Shift+B, or right clicking the file `docker-compose.yml` and selecting "Compose up").

### Running the tests

The project uses the [cypress](https://cypress.io) testing framework. It is set up to run the tests in CI, using `docker-compose` in order to create a real database and Hasura backend for proper end-to-end testing. This should work automatically, and there are custom commands set up in cypress to e.g. run SQL scripts and login to the site. There are a couple of ways to run the tests locally.

#### Run them locally

This has a really nice GUI to let you inspect tests and see exactly what cypress is doing. Start the server, and then run

```bash
npx cypress install # this only needs to be run once
npm run cy:open
```

This will open a window with a list of the test files. Click on a filename to run the tests in that file, or click "Run" to run all the tests. It will open up a browser window to run the tests in. To run this command more easily from VSCode, press `ctrl+shift+p`, and search for "Run test task". To set up a keyboard shortcut, you can add the following to your keybindings.json (the example uses `ctrl+k ctrl+k` (which can be executed by holding `ctrl` and tapping `k` twice)).

```json
{
  "key": "ctrl+k ctrl+k",
  "command": "workbench.action.tasks.runTask",
  "args": "npm: cypress:open"
}
```

#### Run them as if they're in CI

This involves using the CI docker-compose file, which is called `docker-compose.test.yml`. Simply run

```bash
npm run docker:test
```

to run the tests. This won't give you a GUI, but should allow you to see which tests will pass and fail. If there is a discrepancy between your local test results and GitLab CI's test results, it's probably due to data still lurking in your database (but this should be cleaned up properly ([before the tests run](https://docs.cypress.io/guides/references/best-practices.html#Using-after-or-afterEach-hooks)) and recreated as necessary for the tests).

To solve this using VSCode, go into the Docker panel and find the volumes section. There should be a volume called `<DIR>_db_data_test`, where `<DIR>` is the name of the directory the repository is cloned into. Right click this volume and select delete. Hopefully there shouldn't be too many issues with the test database, it's separate from the general dev server database, so your local data shouldn't make a difference to how it runs.

To do this manually with the command line, run

```bash
docker volume ls
```

to list volumes, and then

```bash
docker volume rm <DB_DATA_NAME>
```

where `<DB_DATA_NAME>` is the volume with `db_data_test` at the end of the name. This will delete the entire database. When you run the app, Hasura will once again apply the migrations (all the metadata Hasura needs is stored in postgres).

## Things to note

### SSR/Non SSR

Sapper is awesome in doing server-side rendering, Which really improves the user experience navigating the site, making pages load faster and stopping flashes as content loads sporadically. But this does cause some pain points when doing things like connecting to Hasura, which is quite different on the server (in `preload` functions) and on the client. See the [Auth](#Authentication/Authorization) section below on exactly how this should be done and more detail as to why.

### Environment Variables

The project uses a `.env` file in the root of the repo. There is a `.env.template` file to help you fill it out, and `.env` is gitignored as it contains secrets.

**Important**: Please create and fill out `.env` before running the server

Since environment variables will only work server side, and not client side, the project uses [@rollup/plugin-replace](https://github.com/rollup/plugins/tree/master/packages/replace). This does text replacement for the variables specified in `rollup.config.js`, and this causes a couple of slight differences in how they can be used:

- You cannot use them directly in template string (e.g. `MY_VAR is ${process.env.MY_VAR}`), so assign a variable to the value `process.env.MY_VAR` and reference that instead
- You cannot destructure e.g. `const { MY_VARIABLE } = process.env`, do `const MY_VARIABLE = process.env.MY_VARIABLE` instead

### Docker

The project should now be set up correctly to use `docker-compose`. This should allow you to run the database, backend, and frontend all with one command. It also makes sure they can all communicate as intended; **if you run sapper from outside docker, Hasura will not be able to connect to it for the auth hook**. Follow the instructions [here](https://docs.docker.com/compose/) to install it, and then run

```bash
npm run docker:start
```

from the root of the repository. This will run postgres, Hasura, and sapper. You probably only want to see the sapper logs though, the others don't really log generally useful stuff, and tend to work pretty reliably. In this instance, run:

```bash
docker-compose up -d postgres graphql-engine
docker-compose up sapper
```

which will run postgres and Hasura in detached (ie headless) mode and sapper normally, so it displays the logs. To stop the server, press Ctrl+C and then run

```bash
npm run docker:stop
```

The Hasura image is the cli version, which means it will automatically run migrations from the `hasura/migrations` directory when it starts up.

#### Fixing Docker issues

If docker gives an error message starting something, try replacing `up` with `down` in whatever docker command you're running, then run the `up` version again. This will delete some of the cached information, but won't delete any of the stuff the containers downloaded, that information is in the volumes.

### Authentication/Authorization

Authentication is handled by the server, the login function is in `auth.js`. This makes its own direct connection to the database and the session, which is database backed, also accesses the same database pool. There should be **no** other part of the website that needs to do this.

Hasura is authenticated using a webhook, the location of which is configured when starting Hasura. The hook is accessed at `/auth/hook` and just uses the session to retrieve the user ID and their permissions. Hasura then manages authorization for us (and magically exposes only that API to the user). How to actually make this all work is a bit complicated and depends on whether the data is being fetched from the server (which doesn't have the cookie itself but does have session information) or the client (ie the user's browser, where the cookie lives).

#### Making this actually work on the client side

Since the session information is identified from a cookie, the cookie must be sent to Hasura. This is achieved through a _reverse-proxy_ in `server.js`, which allows the client side to connect to Hasura as if it's connecting to the same domain it is accessing the site through.

**To connect** import the `client` variable from `src/graphql/client.js`. This is a [svelte store](https://svelte.dev/tutorial/writable-stores). It is writable, **do not write to it** --- it is set for you in `src/routes/_layout.svelte`. This should mean you never have to manually connect to GraphQL from the client side.

#### Making this actually work on the server side

Sapper provides [this.fetch](https://sapper.svelte.dev/docs#Preloading), which allows the server to make requests with the client's session. We just need to use `this.fetch` when connecting to Hasura.

**To connect** import the `GraphQLClient` class from `src/graphql/client.ts` and call `new GraphQLClient(this.fetch)`, which will return the client.

### Updating stuff

[svelte:options](https://svelte.dev/tutorial/svelte-options) is really useful. Telling svelte our thing is immutable helps make things even faster by avoiding updating unnecessary content. You need to be slightly careful with how the parent of an immutable component is implemented to make sure it doesn't accidentally reload everything after every update. _Try using flash.js_ from the example on the svelte immutability tutorial section (_[click here](https://svelte.dev/tutorial/svelte-options)_); it's _really_ helpful in working out what's going on! `src/state` contains a `cache` function. This takes a function and returns a modified function which will return a cached result if it has seen the arguments before, and otherwise compute the result using the function provided.

### Emails on the dev server

A few things send emails, e.g. the booking form and the mailing list form. When running from `docker-compose.yml`, the site is configured to use [MailHog](https://github.com/mailhog/MailHog). This catches all the email that are "sent" from the site and allows you to access them at [http://localhost:8025](http://localhost:8025). Some of the Cypress tests use the MailHog API to test email sending.
