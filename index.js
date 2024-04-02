import { eventBridgeInvocation, getReviewData } from "./reviewsService.js";

export const handler = async (event) => {
  console.log("Handler invoked...");
  console.log(event);

  try {
    if (event["detail-type"] != undefined) {
      return await eventBridgeInvocation(event);
    } else {
      switch (event.httpMethod) {
        case "POST":
          if (event.path == "/users") {
            return await updateReview(event);
          }
          break;
        case "GET":
          if (event.path == "/reviews/{prodName}") {
            return await getReviewData(event);
          }
          break;
        default:
          throw new Error("Invalid access");
      }
    }
  } catch (e) {
    return e;
  }
};
