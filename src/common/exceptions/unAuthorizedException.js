import { HttpException } from "./httpException.js";

export class UnAuthorizedException extends HttpException {
  constructor(description = "UNAUTHORIZED") {
    super(description, 403);
  }
}
