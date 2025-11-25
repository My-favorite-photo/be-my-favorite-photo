import { HttpException } from "./httpException.js";

export class InternalServerException extends HttpException {
  constructor(description = "INTERNAL_SERVER_ERROR") {
    super(description, 500);
  }
}
