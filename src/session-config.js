function sessionConfig(env = process.env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres');
  }
  return {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24
    }
  };
}
module.exports = sessionConfig;
