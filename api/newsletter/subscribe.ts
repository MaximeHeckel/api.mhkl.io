import { NowRequest, NowResponse } from "@now/node";
import axios from "axios";

const allowCors = (fn: Function) => async (
  req: NowRequest,
  res: NowResponse
) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

/**
 * Pull BUTTONDOWN_API_KEY secret from env
 */
const { BUTTONDOWN_API_KEY } = process.env;

/**
 * Pass the BUTTONDOWN_API_KEY to the Authorization header
 */
const headers = {
  Authorization: `Token ${BUTTONDOWN_API_KEY}`,
  "Content-Type": "application/json",
};

/**
 * This function calls the Buttondown API subscription endpoint to subscribe the email passed
 * in the argument to my newsletter.
 * @param {string} email The email to send to the Buttondown API subscription endpoint
 */
const subscribe = async (email: string) =>
  axios.post(
    "https://api.buttondown.email/v1/subscribers",
    {
      email,
      tags: ["blog.maximeheckel.com"],
    },
    {
      headers,
    }
  );

/**
 * The handler of serverless function. It takes care of validation (whether the email is present) and
 * also errors (if the user is already subscribed or if there's any other unknown error while subscribing).
 * @param {NowRequest} req
 * @param {NowResponse} res
 */
const handler = async (req: NowRequest, res: NowResponse) => {
  if (req.method === "OPTIONS") {
    return res.status(200);
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    await subscribe(email);
  } catch (error) {
    console.error(error?.response?.data ?? error?.message);
    if (
      error.response &&
      error.response.data &&
      error.response.data.length > 0 &&
      error.response.data[0].includes("already subscribed")
    ) {
      return res
        .status(400)
        .json({ error: "Looks like you already subscribed to my newsletter!" });
    }

    return res.status(400).json({ error: error.message || error.toString() });
  }

  return res.status(200).json({ response: "subscribed!", error: "" });
};

export default allowCors(handler);
