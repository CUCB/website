// Backup to Dropbox, deleting old files if necessary
require("isomorphic-fetch");
const { Dropbox } = require("dropbox");
const moment = require("moment");
const fs = require("fs/promises");
const path = require("path");
const dbx = new Dropbox({ fetch, accessToken: process.env.DROPBOX_ACCESS_TOKEN });

const cutOff = moment().subtract(7, "days");

async function deleteOldDropboxBackups() {
  const files = await dbx.filesListFolder({ path: "/db_backup" });
  let pathsToDelete = files.entries
    .filter((f) => {
      const uploaded = moment(f.client_modified);
      return (
        uploaded.isBefore(cutOff) ||
        uploaded.date() === moment().startOf("month") ||
        uploaded.date() === moment().startOf("month").subtract(1, "months")
      );
    })
    .map((f) => ({ path: f.path_lower }));

  if (pathsToDelete.length > 0) {
    console.log(`Deleting ${pathsToDelete}`);
    let deletion = await dbx.filesDeleteBatch({ entries: pathsToDelete });
    let { complete, failed } = await dbx.filesDeleteBatchCheck(deletion);
    complete && console.log(complete);
    failed && console.err(failed);
  } else {
    console.log("No backups to delete from > 7 days");
  }
}

async function deleteOldLocalBockups() {
  const dir = path.dirname(process.argv[2]);
  const paths = await fs.readdir(dir);
  const pathsToDelete = await Promise.all(
    paths
      .map((filename) => `${dir}/${filename}`)
      .map((filename) => fs.stat(filename).then((stat) => [filename, moment(stat.mtime)])),
  ).then((files) => files.filter(([_, time]) => time.isBefore(cutOff)).map(([filename, _]) => filename));
  await Promise.all(pathsToDelete.map((path) => fs.rm(path)));
}

async function deleteOldBackups() {
  await deleteOldDropboxBackups();
  await deleteOldLocalBockups();
}

async function uploadBackups() {
  const paths = process.argv.slice(2);
  const files = await Promise.all(paths.map((path) => fs.readFile(path).then((contents) => [path, contents])));
  console.log(`Uploading ${paths} to Dropbox`);
  return Promise.all(
    files.map(([name, contents]) =>
      dbx.filesUpload({
        contents,
        path: `/db_backup/${name.split("/").pop()}`,
      }),
    ),
  );
}

function main() {
  uploadBackups()
    .then(() => {
      console.log("Successfully uploaded");
      deleteOldBackups()
        .then(() => console.log("Successfully deleted old backups"))
        .catch((e) => {
          console.error(e);
          process.exit(2);
        });
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

main();
