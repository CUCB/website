"use strict";
const pulumi = require("@pulumi/pulumi");
const digitalocean = require("@pulumi/digitalocean");
const cloudflare = require("@pulumi/cloudflare");
const fs = require("fs");

const stack = pulumi.getStack();

const _default = new digitalocean.SshKey(`ci-bootstrap-${stack}`, {
  publicKey: fs.readFileSync("ssh_keys/ci_login.pub", { encoding: "utf-8" }),
});

// A droplet to host the site
const web = new digitalocean.Droplet("website", {
  image: "ubuntu-20-04-x64",
  region: "lon1",
  size: "s-1vcpu-1gb",
  backups: true,
  name: `website-${stack}`,
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
const webBlockAttachment = new digitalocean.VolumeAttachment("website-block-attachment", {
  // .apply(parseInt) because of https://github.com/pulumi/pulumi-terraform-bridge/issues/352
  dropletId: web.id.apply(parseInt),
  volumeId: webBlock.id,
});

// Create a floating ip so we have somewhere to point dns to even if the droplet is destroyed
const floatingIP = new digitalocean.FloatingIp("website-ip", {
  region: web.region,
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

  const dkimRecord = new cloudflare.Record("dkim-record", {
    name: "mail._domainkey",
    zoneId: "4c380f78cda5910d99c725cb96fceebc",
    type: "TXT",
    value:
      "v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAywzbfSvCqwfIoSBwln0liR43+MFVL4HOgedGtvAiyfhOo1LTpllU0fkoI8IuJPjbEA1P6qWyp7e8gdVGjA4QwiXLEAXedZ+fNukmWODK8tbbR3/pZrFUEw1SIpktI8PX8ECryfNkCzHiU4sXMDZ9SIS2IPI7urBaRNWCvhlppnTHMc+MsFayaLPEVYqFYGDnqXRsIrNFHiI8n870ptEFlZc3VgADb1EG/vu1CRwjZJC0IkGiJI1Y2jp/uRKhWqiNdw0+NfjrzMGCervIgLTu9RhQkUyFvp7lIvYSqM2H90qpfcdy7sBnJMoaXk3uLWDq/Fua0tVY/NiPy0XE/pyuGwIDAQAB",
    ttl: 3600,
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
};
