const { User, sequelize } = require("../src/models");
const { signToken } = require("../src/middleware/auth");
(async () => {
  const user = await User.findOne({ where: { email: "admin@example.com" } });
  console.log("verify", await user.verifyPassword("admin123"));
  console.log("token", signToken(user).slice(0, 20));
  const body = { email: "admin@example.com", password: "admin123" };
  console.log("body password type", typeof body.password);
  try {
    console.log("verify2", await user.verifyPassword(body.password));
  } catch (e) {
    console.error("verify2 error", e);
  }
  await sequelize.close();
})().catch((e) => { console.error(e); process.exit(1); });
