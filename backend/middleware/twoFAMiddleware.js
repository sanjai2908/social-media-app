export const require2FA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.user.twoFactorEnabled && !req.user.twoFactorVerified) {
    return res.status(403).json({ message: "2FA verification required" });
  }
  next();
};
