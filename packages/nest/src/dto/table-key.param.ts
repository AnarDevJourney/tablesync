import { Matches } from "class-validator";
import { SLUG } from "../constants";

// /:tableKey — e.g. 'users', 'orders', 'lab-queue'
export class TableKeyParam {
  @Matches(SLUG, {
    message: "tableKey must be a lowercase slug (a-z, 0-9, -), max 40 characters",
  })
  tableKey: string;
}
