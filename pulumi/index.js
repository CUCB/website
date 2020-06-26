"use strict";
const pulumi = require("@pulumi/pulumi");
const digitalocean = require("@pulumi/digitalocean");
const cloudflare = require("@pulumi/cloudflare");
const fs = require("fs");

const _default = new digitalocean.SshKey("gitlab-ci", {
  publicKey: fs.readFileSync("ssh_keys/gitlab_ci.pub", { encoding: "utf-8" }),
});

// A droplet to host the site
const web = new digitalocean.Droplet("website", {
  image: "ubuntu-20-04-x64",
  region: "lon1",
  size: "s-1vcpu-1gb",
  backups: true,
  name: "Website",
  sshKeys: [_default.fingerprint],
});

// Block storage for a first tier backup (in addition to dropbox)
const webBlock = new digitalocean.Volume("website-block", {
  region: "lon1",
  size: 5,
  initialFilesystemType: "ext4",
  description: "Volume for database backups and user uploads",
});

// Attach said block storage to said droplet
const webBlockAttachment = new digitalocean.VolumeAttachment(
  "website-block-attachment",
  {
    dropletId: web.id,
    volumeId: webBlock.id,
  },
);

// Create a floating ip so we have somewhere to point dns to even if the droplet is destroyed
const floatingIP = new digitalocean.FloatingIp("website-ip", {
  region: web.region,
  dropletId: web.id,
});

// Plumb the DNS stuff in
const domain = new cloudflare.Record("dev-server", {
  name: "dev",
  zoneId: "4c380f78cda5910d99c725cb96fceebc",
  type: "A",
  value: floatingIP.ipAddress,
  ttl: 1,
  proxied: true,
});

module.exports = {
  ip: domain.value,
};
