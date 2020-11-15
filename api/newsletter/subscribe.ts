import { NowRequest, NowResponse } from "@now/node";
import axios from "axios";

/**
 * This pulls the subscription URL defined as an environment variable
 */
const { SUBSCRIPTION_URL: subscriptionURL } = process.env;

/**
 * Queries the substack API
 * Sends the email to the substack subscribe API for the publication specified in the url option
 * @param {string} url the URL of the publication
 * @param {string} email the email that needs to be added as a subscriber to the newsletter
 */
export const subscribe = async (url: string, email: string) => {
  try {
    const res = await axios.post(`${url}/api/v1/free`, {
      first_url: `${url}/subscribe`,
      first_referrer: "",
      current_url: `${url}/subscribe`,
      current_referrer: "",
      referral_code: "",
      source: "subscribe_page",
      email,
    });
    console.log(`${res.status} subscribed ${email} to ${subscriptionURL}`);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * The handler of serverless function
 * @param {NowRequest} req
 * @param {NowResponse} res
 */
const handler = async (
  req: NowRequest,
  res: NowResponse
): Promise<NowResponse> => {
  const { email } = JSON.parse(req.body);
  console.log(`Received subscription request for ${email}`);
  try {
    await subscribe(subscriptionURL, email);
  } catch (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ response: "subscribed!" });
};

export default handler;
