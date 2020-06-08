# CUCB Website

This is the new rewrite of the CUCB website, which uses [sapper](https://sapper.svelte.dev) to do the frontend, and [hasura](https://hasura.io/) for the backend.

## Running the project

To run the project, you need docker and docker-compose. See the section on [docker](#docker) for more information about this. **If you're running on Windows** look at [the relevant page on the wiki](/cucb/website/-/wikis/How-to-Windows) before trying to do this.

However you get the code, you can install dependencies and run the project in development mode with:

```bash
npm run docker:start
```

Or you can use VSCode to start it. Make sure you have the docker extension installed, the find the file called `docker-compose.yml`, right click it, and select "Compose Up".

Open up [localhost:4000](http://localhost:4000) and start clicking around once you've got the server running.

Consult [sapper.svelte.dev](https://sapper.svelte.dev) for help getting started.

## Things to note

### SSR/Non SSR

Sapper is awesome in doing server-side rendering, which really improves the user experience navigating the site, making pages load faster and stopping flashes as content loads sporadically. But this does cause some pain points when doing things like connecting to Hasura, which is quite different on the server (in `preload` functions) and on the client. See the [Auth](#Authentication/Authorization) section below on exactly how this should be done and more detail as to why.

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

### Running the tests

The project uses the [cypress](https://cypress.io) testing framework. It is set up to run the tests in CI, using `docker-compose` in order to create a real database and Hasura backend for proper end-to-end testing. This should work automatically, and there are custom commands set up in cypress to e.g. run SQL scripts and login to the site. There are a couple of ways to run the tests locally.

#### Run them locally

This has a really nice GUI to let you inspect tests and see exactly what cypress is doing. Start the server, and then run

```bash
npm run cy:open
```

**NB** you need to have run `npm install` before you do this for the first time. The wiki has instructions on how to set this up to run properly on Windows [here](https://gitlab.com/cucb/website/-/wikis/How-to-Windows).

This will open a window with a list of the test files. Click on a filename to run the tests in that file, or click "Run" to run all the tests. It will open up a browser window to run the tests in.

#### Run them as if they're in CI

This involves using the CI docker-compose file, which is called `docker-compose.test.yml`. Simply run

```bash
npm run docker:test
```

to run the tests. This won't give you a GUI, but should allow you to see which tests will pass and fail. If there is a discrepancy between your local test results and GitLab CI's test results, it's probably due to data still lurking in your database.

To solve this using VSCode, go into the Docker panel and find the volumes section. There should be a volume called `<DIR>_db_data_test`, where `<DIR>` is the name of the directory the repository is cloned into. Right click this volume and select delete. Hopefully there shouldn't be too many issues with the test database, it's separate from the general dev server database, so your local data shouldn't make a difference to how it runs.

To do this manually with the command line, run

```bash
docker volume ls
```

to list volumes, and then

```bash
docker volume rm <DB_DATA_NAME>
```

where `<DB_DATA_NAME>` is the volume with `db_data` at the end of the name. This will delete the entire database. When you run the app, Hasura will once again apply the migrations (all the metadata Hasura needs is stored in postgres).

### Authentication/Authorization

Authentication is handled by the server, the login function is in `auth.js`. This makes its own direct connection to the database and the session, which is database backed, also accesses the same database pool. There should be **no** other part of the website that needs to do this.

Hasura is authenticated using a webhook, the location of which is configured when starting Hasura. The hook is accessed at `/auth/hook` and just uses the session to retrieve the user ID and their permissions. Hasura then manages authorization for us (and magically exposes only that API to the user). How to actually make this all work is a bit complicated and depends on whether the data is being fetched from the server (which doesn't have the cookie itself but does have session information) or the client (ie the user's browser, where the cookie lives).

#### Making this actually work on the client side

Since the session information is identified from a cookie, the cookie must be sent to Hasura. This is achieved through a _reverse-proxy_ in `server.js`, which allows the client side to connect to Hasura as if it's connecting to the same domain it is accessing the site through.

**To connect** import the `client` variable from `src/graphql/client.js`. This is a [svelte store](https://svelte.dev/tutorial/writable-stores). It is writable, **do not write to it** --- it is set for you in `src/routes/_layout.svelte`. This should mean you never have to manually connect to GraphQL from the client side.

#### Making this actually work on the server side

Sapper provides [this.fetch](https://sapper.svelte.dev/docs#Preloading), which allows the server to make requests with the client's session. We just need to use `this.fetch` when connecting to Hasura.

**To connect** import the `makeClient` function from `src/graphql/client.js` and call `makeClient(this.fetch)`, which will return the client.

### Updating stuff

[svelte:options](https://svelte.dev/tutorial/svelte-options) is really useful. Telling svelte our thing is immutable helps make things even faster by avoiding updating unnecessary content. You need to be slightly careful with how the parent of an immutable component is implemented to make sure it doesn't accidentally reload everything after every update. _Try using flash.js_ from the example on the svelte immutability tutorial section (_[click here](https://svelte.dev/tutorial/svelte-options)_); it's _really_ helpful in working out what's going on! `src/state` contains a `cache` function. This takes a function and returns a modified function which will return a cached result if it has seen the arguments before, and otherwise compute the result using the function provided.

## Structure

Sapper expects to find two directories in the root of your project — `src` and `static`.

### src

The [src](src) directory contains the entry points for your app — `client.js`, `server.js` and (optionally) a `service-worker.js` — along with a `template.html` file and a `routes` directory.

#### src/routes

This is the heart of your Sapper app. There are two kinds of routes — _pages_, and _server routes_.

**Pages** are Svelte components written in `.svelte` files. When a user first visits the application, they will be served a server-rendered version of the route in question, plus some JavaScript that 'hydrates' the page and initialises a client-side router. From that point forward, navigating to other pages is handled entirely on the client for a fast, app-like feel. (Sapper will preload and cache the code for these subsequent pages, so that navigation is instantaneous.)

**Server routes** are modules written in `.js` files, that export functions corresponding to HTTP methods. Each function receives Express `request` and `response` objects as arguments, plus a `next` function. This is useful for creating a JSON API, for example.

There are three simple rules for naming the files that define your routes:

- A file called `src/routes/about.svelte` corresponds to the `/about` route. A file called `src/routes/blog/[slug].svelte` corresponds to the `/blog/:slug` route, in which case `params.slug` is available to the route
- The file `src/routes/index.svelte` (or `src/routes/index.js`) corresponds to the root of your app. `src/routes/about/index.svelte` is treated the same as `src/routes/about.svelte`.
- Files and directories with a leading underscore do _not_ create routes. This allows you to colocate helper modules and components with the routes that depend on them — for example you could have a file called `src/routes/_helpers/datetime.js` and it would _not_ create a `/_helpers/datetime` route

### static

The [static](static) directory contains any static assets that should be available. These are served using [sirv](https://github.com/lukeed/sirv).

In your [service-worker.js](src/service-worker.js) file, you can import these as `files` from the generated manifest...

```js
import { files } from "@sapper/service-worker";
```

...so that you can cache them (though you can choose not to, for example if you don't want to cache very large files).

## Bundler config

The website uses Rollup and dynamic imports, as well as compiling your Svelte components. The configuration can be edited to add plugins, which currently includes the sass preprocessor, which allows us to write sass code instead of css.

## Production mode and deployment

To start a production version of your app, run `npm run build && npm start`. This will disable live reloading, and activate the appropriate bundler plugins.

You can deploy your application to any environment that supports Node 10 or above. As an example, to deploy to [ZEIT Now](https://zeit.co/now) when using `sapper export`, run these commands:

```bash
npm install -g now
now
```

If your app can't be exported to a static site, you can use the [now-sapper](https://github.com/thgh/now-sapper) builder. You can find instructions on how to do so in its [README](https://github.com/thgh/now-sapper#basic-usage).

## Using external components

When using Svelte components installed from npm, such as [@sveltejs/svelte-virtual-list](https://github.com/sveltejs/svelte-virtual-list), Svelte needs the original component source (rather than any precompiled JavaScript that ships with the component). This allows the component to be rendered server-side, and also keeps your client-side app smaller.

Because of that, it's essential that the bundler doesn't treat the package as an _external dependency_. You can either modify the `external` option under `server` in [rollup.config.js](rollup.config.js) or the `externals` option in [webpack.config.js](webpack.config.js), or simply install the package to `devDependencies` rather than `dependencies`, which will cause it to get bundled (and therefore compiled) with your app:

```bash
npm install -D @sveltejs/svelte-virtual-list
```
