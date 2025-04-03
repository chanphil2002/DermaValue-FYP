import { RequestHandler } from "express";

const setOriginalUrl: RequestHandler = (req, res, next) => {
    // Add req.originalUrl to res.locals so it can be accessed in templates
    res.locals.originalUrl = req.originalUrl;
    next();
  };
  
  export default setOriginalUrl;