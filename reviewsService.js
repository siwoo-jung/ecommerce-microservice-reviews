import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
let res = {
  headers: {},
  statusCode: 0,
  body: {},
};

export const eventBridgeInvocation = async (event) => {
  console.log("eventBridgeInvocation invoked...");
  console.log(event);

  if (!event || !event.detail) {
    res.statusCode = 400;
    res.body = JSON.stringify({ message: "Invalid" });
    return res;
  }

  const { email, title, rating, description, prodId, firstName, lastName } =
    event.detail;

  try {
    const getReviewCommand = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_REVIEWS,
      Key: {
        item: prodId,
      },
    });
    const getReviewResponse = await docClient.send(getReviewCommand);

    // If a user's review does not exist
    let newNumReview;
    let newAvgRating;
    const currentNumReview = getReviewResponse.Item.numReview;
    const currentAvgRating = getReviewResponse.Item.avgRating;

    if (!getReviewResponse.Item.reviews.hasOwnProperty(email)) {
      newNumReview = currentNumReview + 1;
      newAvgRating =
        (currentAvgRating * currentNumReview + rating) / newNumReview;
    } else {
      const currentRating = getReviewResponse.Item.reviews[email].rating;
      newNumReview = currentNumReview;
      newAvgRating =
        (currentAvgRating * currentNumReview - currentRating + rating) /
        newNumReview;
    }

    if (!Number.isInteger(newAvgRating)) {
      newAvgRating = newAvgRating.toFixed(2);
    }

    getReviewResponse.Item.reviews[email] = {
      title,
      rating,
      description,
      date: new Date().toLocaleString("en-AU", {
        timeZone: "Australia/Sydney",
        timeZoneName: "short",
        hour12: false,
      }),
      firstName,
      lastName,
    };
    const updateCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_REVIEWS,
      Key: {
        item: prodId,
      },
      UpdateExpression:
        "set reviews = :v_reviews, numReview = :v_numReview, avgRating = :v_avgRating",
      ExpressionAttributeValues: {
        ":v_reviews": getReviewResponse.Item.reviews,
        ":v_numReview": newNumReview,
        ":v_avgRating": newAvgRating,
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResponse = await docClient.send(updateCommand);

    res.statusCode = 200;
    res.body = JSON.stringify({ message: "Update Successful" });
  } catch (e) {
    console.log(e);
    res.statusCode = 500;
    res.body = JSON.stringify({ message: "Server Error" });
  } finally {
    return res;
  }
};

export const getReviewData = async (event) => {
  console.log("Invoking getReviewData...");
  console.log(event);

  if (!event || !event.prodName) {
    res.statusCode = 400;
    res.body = JSON.stringify({ message: "Invalid" });
    return res;
  }

  const prodName = event.prodName;

  try {
    const getReviewCommand = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_REVIEWS,
      Key: {
        item: prodName,
      },
    });
    const getReviewResponse = await docClient.send(getReviewCommand);

    res.statusCode = 200;
    res.body = JSON.stringify(getReviewResponse.Item);
  } catch (e) {
    console.log(e);
    res.statusCode = 500;
    res.body = JSON.stringify({ message: "Server Error" });
  } finally {
    return res;
  }
};
