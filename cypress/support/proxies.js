const emailGetters = {
  get: function(target, prop, receiver) {
    if (prop === "replyTo") {
      return target.Content.Headers["Reply-To"];
    } else if (prop === "body") {
      return target.Content.Body;
    }
    return Reflect.get(...arguments);
  },
};

export function Email(email) {
  return new Proxy(email, emailGetters);
}
