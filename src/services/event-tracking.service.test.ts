import { describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import { trackAppEvent } from "./event-tracking.service";

describe("event tracking service", () => {
  it("stores a named event with its properties without blocking the caller", async () => {
    let parameters: unknown[] = [];
    const database = {
      runAsync: async (_query: string, ...values: unknown[]) => {
        parameters = values;
      },
    } as unknown as SQLiteDatabase;

    await trackAppEvent(database, "button_pressed", {
      kind: "button",
      label: "Save changes",
      variant: "primary",
    });

    expect(parameters[0]).toEqual(expect.any(String));
    expect(parameters[1]).toBe("button_pressed");
    expect(JSON.parse(String(parameters[2]))).toEqual({
      kind: "button",
      label: "Save changes",
      variant: "primary",
    });
    expect(parameters[3]).toEqual(expect.any(String));
  });
});
