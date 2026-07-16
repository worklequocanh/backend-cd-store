export const getJwtConfig = () => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '1d';
  const cookieMaxAge = Number(process.env.JWT_REFRESH_COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000;

  return {
    secret: process.env.JWT_SECRET || 'secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh',
    expiresIn,
    refreshExpiresIn,
    cookieMaxAge
  };
};
