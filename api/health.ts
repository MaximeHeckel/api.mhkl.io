import { NowRequest, NowResponse, NowRequestBody } from "@now/node";
import { GraphQLClient, gql } from "graphql-request";

const { FAUNADB_SECRET: secret } = process.env;

const URI = "https://graphql.fauna.com/graphql";

/**
 * Initiate the GraphQL client
 */
const graphQLClient = new GraphQLClient(URI, {
  headers: {
    authorization: `Bearer ${secret}`,
  },
});

/**
 * Format the sample to a more friendly data structure
 * @param {values: string; timestamps: string;} entry
 * @returns {Array<{ value: number; timestamp: string }>}
 */
const formathealthSample = (entry: {
  values: string;
  timestamps: string;
}): Array<{ value: number; timestamp: string }> => {
  /**
   * We destructure the sample entry based on the structure defined in the dictionaries
   * in the Get Content Of action of our shortcut
   */
  const { values, timestamps } = entry;

  const formattedSample = values
    // split the string by \n to obtain an array of values
    .split("\n")
    // [Edge case] filter out any potential empty strings, these happen when a new day starts and no values have been yet recorded
    .filter((item) => item !== "")
    .map((item, index) => {
      return {
        value: parseInt(item, 10),
        timestamp: new Date(timestamps.split("\n")[index]).toISOString(),
      };
    });

  return formattedSample;
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
  console.info("==============================");
  console.info(`[${new Date().toISOString()}]`);

  /**
   * Destructure the body of the request based on the payload defined in the shortcut
   */
  const { heart, steps, date: deviceDate } = req.body as NowRequestBody;

  /**
   * Format the steps data
   */
  const formattedStepsData = formathealthSample(steps);
  console.info(
    `Steps: ${
      formattedStepsData.filter((item) => item.value !== 0).length
    } items`
  );

  /**
   * Format the heart data
   */
  const formattedHeartData = formathealthSample(heart);
  console.info(`Heart Rate: ${formattedHeartData.length} items`);

  /**
   * Variable "today" is a date set based on the device date at midninight
   * This will be used as way to timestamp our documents in the database
   */
  const today = new Date(`${deviceDate}T00:00:00.000Z`);

  const entry = {
    heartRate: formattedHeartData,
    steps: formattedStepsData,
    date: today.toISOString(),
  };

  const mutation = gql`
    mutation($entries: [EntryInput]) {
      addEntry(entries: $entries) {
        heartRate {
          value
          timestamp
        }
        steps {
          value
          timestamp
        }
        date
      }
    }
  `;

  try {
    await graphQLClient.request(mutation, {
      entries: [entry],
    });
    console.info(
      "Successfully transfered heart rate and steps data to database"
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ response: error.response.errors[0].message });
  }

  return res.status(200).json({ response: "OK" });
};

export default handler;
