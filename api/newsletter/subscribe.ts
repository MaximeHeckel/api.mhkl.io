import { NowRequest, NowResponse } from "@now/node";
import axios from "axios";

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
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    await subscribe(email);
  } catch (error) {
    if (
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

export default handler;
