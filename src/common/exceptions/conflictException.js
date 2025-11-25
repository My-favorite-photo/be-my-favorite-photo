import { HttpException } from "./httpException.js";

export class ConflictException extends HttpException {
  constructor(description = "CONFLICT") {
    super(description, 409);
  }
}
