import dotenv from "dotenv";
dotenv.config();
import express, { Express, NextFunction, Request, Response } from "express";
import path from "path";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import session from "express-session";
import flash from "connect-flash";
import methodOverride from "method-override";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import qs from "qs";

// Import Routes
import authRouter from "./routes/authRouter";
import clinicianRouter from "./routes/clinicianRouter";
import adminRouter from "./routes/adminRouter";
import clinicRouter from "./routes/clinicRouter";
import caseRouter from "./routes/cases/index";
import appointmentRouter from "./routes/appointmentRouter";
import userRouter from "./routes/userRouter";
import diseaseRouter from "./routes/diseaseRouter";
import leaderboardRouter from "./routes/leaderboardRouter";
import setOriginalUrl from "./util/middleware";

const app: Express = express();

// Set EJS as the templating engine
app.engine("ejs", require("ejs-mate"));
app.set("view engine", "ejs");

// Set views directory
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(morgan((tokens, req, res) => {
    // Skip logging for static files like .css, .js, .png, etc.
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)) {
      return null;
    }
  
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens['response-time'](req, res), 'ms'
    ].join(' ');
  }));
app.use(express.static(path.join(__dirname, "public")));
app.use(setOriginalUrl);

// Override Express's default query parser with `qs`
app.set("query parser", (str: string) => qs.parse(str));

// Router
app.use("/", authRouter);
app.use("/clinicians", clinicianRouter);
app.use("/admin", adminRouter);
app.use("/clinics", clinicRouter);
app.use("/cases", caseRouter);
app.use("/appointments", appointmentRouter);
app.use("/users", userRouter);
app.use("/diseases", diseaseRouter);
app.use("/leaderboard", leaderboardRouter);

app.use((req, res, next) => { 
    if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
        req.body = qs.parse(req.body);
    }
    next(createHttpError(404, "Enpoint Not found")); 
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(error);
    let errorMessage = "An error occurred";
    let statusCode = 500;
    // if (error instanceof Error) { errorMessage = error.message; }
    if (isHttpError(error)) {
        errorMessage = error.message;
        statusCode = error.status;
    }
    res.status(statusCode).json({ message: errorMessage });
});

export default app;