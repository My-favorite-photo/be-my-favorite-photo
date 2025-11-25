import { HttpException } from "./httpException.js";

export class BadRequestException extends HttpException {
  constructor(description = "BAD_REQUEST") {
    super(description, 400);
  }
}
