# CUCB Website

This is the new (as of February 2023) CUCB website, which uses [SvelteKit](https://kit.svelte.dev) (for both the frontend and backend).

## Dependencies

- [Node.js and npm](https://nodejs.org/en/download/) (node package manager)
- [Docker and docker-compose](https://www.docker.com/products/docker-desktop) - on Ubuntu use `sudo apt install docker docker-compose`
- [Visual studio code](https://code.visualstudio.com/) (or [VSCodium](https://github.com/VSCodium/vscodium)) - an editor with good support from svelte via an extension. There is config in the repository to help you get set up.

### Installing on Windows

For some tips on how to get best set up if you're running Windows, see [the relevant page on the wiki](https://github.com/CUCB/website/wiki/How-to-Windows).

## Getting started

1. Clone the repository
2. Open the repository in VSCode
3. Install the recommended extensions. Press `ctrl+shift+p` (or probably `cmd+shift+p` on Mac) and search for "show recommended extensions" (without the quotes) and press enter to select the option that appears. Install all the extensions under the heading "Workspace recommended extensions".
4. Run `npm install`. This will install the dependencies locally, including Cypress (the test runner), hasura-cli (which is used to manage database migrations), prettier (a code formatter), and a git hook via husky (which will format the code with prettier when making a git commit)
5. Run `npm run docker:start` (in VSCode, this should be possible by just pressing Ctrl+Shift+B, or right clicking the file `docker-compose.yml` and selecting "Compose up").

### Running the tests

The project uses the [Cypress](https://cypress.io) testing framework. It is set up to run the tests in CI, using `docker-compose` in order to create a real database and Hasura backend for proper end-to-end testing. This should work automatically, and there are custom commands set up in cypress to e.g. run SQL scripts and login to the site. There are a couple of ways to run the tests locally.

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

#### Unit tests

There are also a few unit tests, these can be run with:

```
npm run test:unit
```

## Things to note

### Environment Variables

It's often useful to be able to configure things at runtime, like database connection details, rather than hard-coding them into the website. This is particularly important with secrets which we don't want to share with the world by committing them to this repository! We achieve this by using things called environment variables.

When running the development server, SvelteKit will read the file called `.env.development`. This sets a bunch of default values for the environment variables, connecting SvelteKit to postgres and mailhog as they are set up to run in the default `docker-compose.yml` file.

There are also a (very small) number (as I write this, one) of variables that need to be set manually. These are defined in `.env.local.template`. Copy this file to `.env.local` and then fill in the appropriate values for the variables.

### Docker

**NB** you don't _need_ to run docker to run the development server these days, but you will have to instead run postgres and mailhog locally, which may or may correspond with your definition of fun. Bear in mind we're not building any of the site in docker, and we're making very few database queries, so even if docker performance leaves a bit to be desired on your shiny new `/M[1-9][0-9]* Mac/`, it shouldn't cause any problems.

The project should now be set up correctly to use `docker-compose`. This should allow you to run the database, mailhog and caddy (the frontend server) all with one command. The development server is seperate since it is useful to see error messages and have an easy way to kick it when things break. It also means that you don't have to build anything in docker locally, which will probably save a lot of effort. Follow the instructions [here](https://docs.docker.com/compose/) to install it, and then run

```bash
npm run docker:start
```

from the root of the repository. This will run postgres, mailhog, and caddy. To stop the server run

```bash
npm run docker:stop
```

The Hasura image is the cli version, which means it will automatically run migrations from the `hasura/migrations` directory when it starts up.

#### Fixing Docker issues

If docker gives an error message starting something, try replacing `up` with `down` in whatever docker command you're running, then run the `up` version again. This will delete some of the cached information, but won't delete any of the stuff the containers downloaded, that information is in the volumes.

### Authentication/Authorization

Authentication is handled by the server, the login function is in `src/auth.ts`. The permissions are defined in `src/lib/permissions.ts` (and also in the database, kinda, which I really should clarify). When a user logs in, we first create a session in the database, which basically just keeps track of what user is logged in (along with a few per-device settings) and set a cookie in their browser which is an encrypted version of a session token in the database (yes I know lots of people seem to like JWTs in local storage or some other solution, [they're wrong](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/)). The magic of cookies is they are sent with every request, so then we can just use a hook to check if this matches a valid session, and then pass that session to any handlers we have.

### Emails on the dev server

A few things send emails, e.g. the booking form and the mailing list form. When running from `docker-compose.yml`, the site is configured to use [MailHog](https://github.com/mailhog/MailHog). This catches all the email that are "sent" from the site and allows you to access them at [http://localhost:8025](http://localhost:8025). Some of the Cypress tests use the MailHog API to test email sending.

### Updating stuff

[svelte:options](https://svelte.dev/tutorial/svelte-options) is really useful. Telling svelte our thing is immutable helps make things even faster by avoiding updating unnecessary content. You need to be slightly careful with how the parent of an immutable component is implemented to make sure it doesn't accidentally reload everything after every update. _Try using flash.js_ from the example on the svelte immutability tutorial section (_[click here](https://svelte.dev/tutorial/svelte-options)_); it's _really_ helpful in working out what's going on! `src/state` contains a `cache` function. This takes a function and returns a modified function which will return a cached result if it has seen the arguments before, and otherwise compute the result using the function provided.
