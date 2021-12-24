export function post(req, res, next) {
  req.session.theme = { ...req.body };
  req.session.save(() => {
    res.statusCode = 204;
    res.end(JSON.stringify(req.session));
  });
}
