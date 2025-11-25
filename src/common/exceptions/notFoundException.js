import { HttpException } from "./httpException.js";

export class NotFoundException extends HttpException {
  constructor(description = "NOT_FOUND") {
    super(description, 404);
  }
}
