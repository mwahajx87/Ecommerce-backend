export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0]?.message ?? "Invalid request" });
    }
    req[source] = result.data;
    return next();
  };
}
