const { verifyToken } = require("../utils/jwt");

/**  
===============================================
  ADMIN AUTH MIDDLEWARE
=============================================== 
*/

const authAdmin = async (req, res, next) => {
  try {
    const headers = req.headers;
    // console.log(headers);

    const headerToken = headers["authorization"] || headers["x-access-token"];
    let token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).send({
        message: "No token provided!",
      });
    }
    const response = verifyToken(token);
    // console.log("Response from verifyToken:", response);
    if (!response) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (response.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }
    req.user = response;

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

/**  
===============================================
  SELLER AUTH MIDDLEWARE
=============================================== 
*/

const authSeller = async (req, res, next) => {
  try {
    const headers = req.headers;
    // console.log(headers);

    const headerToken = headers["authorization"] || headers["x-access-token"];
    let token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).send({
        message: "No token provided!",
      });
    }
    const response = verifyToken(token);
    // console.log("Response from verifyToken:", response);
    if (!response) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    if (response.role !== "seller") {
      return res.status(403).json({ message: "Seller access only" });
    }
    req.user = response;
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

module.exports = { authAdmin, authSeller };
