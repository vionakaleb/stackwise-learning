import { describe, expect, it } from "vitest";
import {
  BlueprintError,
  BlueprintLevel,
  computeBlastRadius,
  countCohesionBreaks,
  createInitialSystem,
  evaluate,
  moveResponsibility,
} from "@/engines/blueprint/engine";

const level: BlueprintLevel = {
  id: "coupling-test",
  responsibilities: [
    { id: "price", label: "Work out the price", tags: ["pricing"] },
    { id: "tax", label: "Apply tax", tags: ["pricing"] },
    { id: "email", label: "Send the receipt", tags: ["notification"] },
    { id: "sms", label: "Send an SMS alert", tags: ["notification"] },
  ],
  startBlueprints: [
    { id: "order", name: "Order", responsibilityIds: ["price", "tax", "email"] },
    { id: "alerts", name: "Alerts", responsibilityIds: ["sms"] },
  ],
  dependencies: [{ dependentId: "alerts", dependencyId: "order" }],
  changeRequests: [{ id: "cr-1", label: "Switch email provider", tag: "notification" }],
  targetBlastRadius: 1,
  spareBlueprintNames: ["Notifier"],
};

describe("blueprint blast radius", () => {
  it("counts every blueprint holding the changed responsibility", () => {
    const radius = computeBlastRadius(createInitialSystem(level), level, level.changeRequests[0]);
    expect(radius.directIds.sort()).toEqual(["alerts", "order"]);
    expect(radius.total).toBe(2);
  });

  it("adds dependants one hop out when they do not already carry the tag", () => {
    const narrowLevel: BlueprintLevel = {
      ...level,
      startBlueprints: [
        { id: "order", name: "Order", responsibilityIds: ["price", "tax", "email", "sms"] },
        { id: "alerts", name: "Alerts", responsibilityIds: [] },
      ],
    };
    const radius = computeBlastRadius(createInitialSystem(narrowLevel), narrowLevel, level.changeRequests[0]);
    expect(radius.directIds).toEqual(["order"]);
    expect(radius.rippleIds).toEqual(["alerts"]);
  });

  it("shrinks the radius once notification work sits in one place", () => {
    const gathered = moveResponsibility(createInitialSystem(level), "email", "alerts");
    const radius = computeBlastRadius(gathered, level, level.changeRequests[0]);
    expect(radius.directIds).toEqual(["alerts"]);
    expect(radius.total).toBe(1);
  });

  it("does not clear while a blueprint sits empty", () => {
    const emptied = moveResponsibility(
      moveResponsibility(
        moveResponsibility(createInitialSystem(level), "sms", "order"),
        "email",
        "order",
      ),
      "price",
      "order",
    );
    expect(evaluate(emptied, level).emptyBlueprintCount).toBe(1);
    expect(evaluate(emptied, level).cleared).toBe(false);
  });

  it("counts a blueprint mixing two tag groups as one cohesion break", () => {
    expect(countCohesionBreaks(createInitialSystem(level), level)).toBe(1);
  });

  it("rejects a move to a blueprint that does not exist", () => {
    expect(() => moveResponsibility(createInitialSystem(level), "email", "ghost")).toThrow(BlueprintError);
  });
});
