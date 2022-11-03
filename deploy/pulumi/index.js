"use strict";
const pulumi = require("@pulumi/pulumi");
const digitalocean = require("@pulumi/digitalocean");
const cloudflare = require("@pulumi/cloudflare");
const fs = require("fs");

const stack = pulumi.getStack();

if (stack === "shared") {
  const sshKey = new digitalocean.SshKey(`ci-bootstrap`, {
    publicKey: fs.readFileSync("ssh_keys/ci_login.pub", { encoding: "utf-8" }),
  });

  module.exports = {
    sshKeyFingerprint: sshKey.fingerprint,
  };
  return;
}

const shared = new pulumi.StackReference("cucb/cucb-website/shared");

const region = "lon1";

// A droplet to host the site
const web = new digitalocean.Droplet("website", {
  image: "ubuntu-20-04-x64",
  region,
  size: "s-1vcpu-1gb",
  backups: true,
  name: `website-${stack}`,
  sshKeys: [shared.getOutput("sshKeyFingerprint")],
});

// Block storage for a first tier backup (in addition to dropbox)
const webBlock = new digitalocean.Volume("website-block", {
  region,
  size: 5,
  initialFilesystemType: "ext4",
  description: "Volume for database backups and user uploads",
});

// Attach said block storage to said droplet
const webBlockAttachment = new digitalocean.VolumeAttachment("website-block-attachment", {
  // .apply(parseInt) because of https://github.com/pulumi/pulumi-terraform-bridge/issues/352
  dropletId: web.id.apply(parseInt),
  volumeId: webBlock.id,
});

// Create a floating ip so we have somewhere to point dns to even if the droplet is destroyed
const floatingIP = new digitalocean.FloatingIp("website-ip", {
  region,
});

// Assign it to the droplet separately so we don't recreate it if
const floatingIPAssignment = new digitalocean.FloatingIpAssignment("website-ip-assignment", {
  ipAddress: floatingIP.ipAddress,
  // Use .apply(parseInt) as a workaround for https://github.com/pulumi/pulumi-digitalocean/issues/218
  dropletId: web.id.apply(parseInt),
});

let domain;
if (stack === "prod") {
  // Plumb the DNS stuff in
  domain = new cloudflare.Record("dev-server", {
    name: "dev",
    zoneId: "4c380f78cda5910d99c725cb96fceebc",
    type: "A",
    value: floatingIP.ipAddress,
    ttl: 1,
    proxied: true,
  });

  const sshDomain = new cloudflare.Record("ssh-dev-server", {
    name: "ssh.dev",
    zoneId: "4c380f78cda5910d99c725cb96fceebc",
    type: "A",
    value: floatingIP.ipAddress,
    ttl: 1,
    proxied: false,
  });
} else {
  // Plumb the DNS stuff in
  domain = new cloudflare.Record("dev-server", {
    name: "kit",
    zoneId: "4c380f78cda5910d99c725cb96fceebc",
    type: "A",
    value: floatingIP.ipAddress,
    ttl: 1,
    proxied: false,
  });
}

module.exports = {
  ip: domain.value,
  domain_name: domain.hostname,
};
