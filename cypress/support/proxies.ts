export interface Email {
  replyTo?: string;
  body: string;
  ID: string;
}

const emailGetters = {
  get: function (target, prop, receiver) {
    if (prop === "replyTo") {
      return target.Content.Headers["Reply-To"];
    } else if (prop === "body") {
      return target.Content.Body;
    }
    return Reflect.get(target, prop, receiver);
  },
};

export function Email(email): Email {
  return new Proxy(email, emailGetters);
}
