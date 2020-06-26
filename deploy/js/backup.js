// Backup to Dropbox, deleting old files if necessary
require("isomorphic-fetch");
let { Dropbox } = require("dropbox");
let moment = require("moment");
let fs = require("fs");
let dbx = new Dropbox({ fetch, accessToken: process.env.DROPBOX_ACCESS_TOKEN });

async function deleteOldBackups() {
  const cutOff = moment().subtract(7, "days");
  const files = await dbx.filesListFolder({ path: "/db_backup" });
  let pathsToDelete = files.entries
    .filter(f => {
      const uploaded = moment(f.client_modified);
      return (
        uploaded.isBefore(cutOff) ||
        uploaded.date() === moment().startOf("month") ||
        uploaded.date() ===
          moment()
            .startOf("month")
            .subtract(1, "months")
      );
    })
    .map(f => ({ path: f.path_lower }));

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

async function uploadBackups() {
  const contents = process.argv
    .slice(2)
    .map((fn, _) => [fn, fs.readFileSync(fn)]);
  console.log(`Uploading ${process.argv.slice(2)} to Dropbox`);
  return Promise.all(
    contents.map(([fn, contents]) =>
      dbx.filesUpload({
        contents,
        path: `/db_backup/${fn.split("/").pop()}`,
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
        .catch(e => {
          console.error(e);
          process.exit(2);
        });
    })
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

main();
