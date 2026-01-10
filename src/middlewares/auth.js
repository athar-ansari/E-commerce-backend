const { verifyToken } = require("../utils/jwt");

const authAdmin = async (req, res, next) => {
  try {
    const headers = req.headers;
    console.log(headers);

    const headerToken = headers["authorization"] || headers["x-access-token"];
    let token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).send({
        message: "No token provided!",
      });
    }
    const response = verifyToken(token);
    console.log("Response from verifyToken:", response);
    if (!response) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (response.role !== "admin") {
      return res.status(401).send({
        message: "Unauthorized Role!",
      });
    }

    next();
    return;
  } catch (error) {
    if (error.message === "jwt malformed") {
      return res.status(401).send({
        message: "Something went wrong !! Try Again",
      });
    }
    return res.status(401).send({
      message: error.message,
    });
  }
};

module.exports = { authAdmin };
