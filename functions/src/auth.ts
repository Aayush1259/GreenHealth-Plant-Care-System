import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Simple authentication function to handle NextAuth requests
 * in a static hosting environment
 */
export const authHandler = onRequest((request, response) => {
  logger.info("Auth request received", {
    path: request.path,
    method: request.method,
    body: request.body
  });
  
  // For now, return a basic response
  // This would need to be expanded to properly handle auth
  response.status(200).json({
    user: null,
    session: null,
    error: "Firebase auth handling not fully implemented"
  });
}); 