export interface Responsibility {
  id: string;
  label: string;
  tags: string[];
}

export interface Blueprint {
  id: string;
  name: string;
  responsibilityIds: string[];
}

export interface Dependency {
  dependentId: string;
  dependencyId: string;
}

export interface ChangeRequest {
  id: string;
  label: string;
  tag: string;
}

export interface BlueprintLevel {
  id: string;
  responsibilities: Responsibility[];
  startBlueprints: Blueprint[];
  dependencies: Dependency[];
  changeRequests: ChangeRequest[];
  targetBlastRadius: number;
  spareBlueprintNames: string[];
}

export interface BlueprintSystem {
  blueprints: Blueprint[];
  dependencies: Dependency[];
}

export class BlueprintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlueprintError";
  }
}

export function createInitialSystem(level: BlueprintLevel): BlueprintSystem {
  return {
    blueprints: level.startBlueprints.map((blueprint) => ({
      ...blueprint,
      responsibilityIds: [...blueprint.responsibilityIds],
    })),
    dependencies: [...level.dependencies],
  };
}

function findResponsibility(level: BlueprintLevel, responsibilityId: string): Responsibility {
  const responsibility = level.responsibilities.find((item) => item.id === responsibilityId);
  if (!responsibility) {
    throw new BlueprintError(`Unknown responsibility "${responsibilityId}".`);
  }
  return responsibility;
}

export function moveResponsibility(
  system: BlueprintSystem,
  responsibilityId: string,
  destinationBlueprintId: string,
): BlueprintSystem {
  const destination = system.blueprints.find((blueprint) => blueprint.id === destinationBlueprintId);
  if (!destination) {
    throw new BlueprintError(`Unknown blueprint "${destinationBlueprintId}".`);
  }
  if (destination.responsibilityIds.includes(responsibilityId)) {
    return system;
  }

  return {
    ...system,
    blueprints: system.blueprints.map((blueprint) => {
      if (blueprint.id === destinationBlueprintId) {
        return { ...blueprint, responsibilityIds: [...blueprint.responsibilityIds, responsibilityId] };
      }
      return {
        ...blueprint,
        responsibilityIds: blueprint.responsibilityIds.filter((id) => id !== responsibilityId),
      };
    }),
  };
}

function blueprintsCarryingTag(system: BlueprintSystem, level: BlueprintLevel, tag: string): string[] {
  return system.blueprints
    .filter((blueprint) =>
      blueprint.responsibilityIds.some((responsibilityId) =>
        findResponsibility(level, responsibilityId).tags.includes(tag),
      ),
    )
    .map((blueprint) => blueprint.id);
}

export interface BlastRadius {
  changeRequestId: string;
  directIds: string[];
  rippleIds: string[];
  total: number;
}

export function computeBlastRadius(
  system: BlueprintSystem,
  level: BlueprintLevel,
  changeRequest: ChangeRequest,
): BlastRadius {
  const directIds = blueprintsCarryingTag(system, level, changeRequest.tag);
  const rippleIds = system.dependencies
    .filter(
      (dependency) =>
        directIds.includes(dependency.dependencyId) && !directIds.includes(dependency.dependentId),
    )
    .map((dependency) => dependency.dependentId);
  const uniqueRipple = [...new Set(rippleIds)];

  return {
    changeRequestId: changeRequest.id,
    directIds,
    rippleIds: uniqueRipple,
    total: directIds.length + uniqueRipple.length,
  };
}

export function countCohesionBreaks(system: BlueprintSystem, level: BlueprintLevel): number {
  return system.blueprints.reduce((breaks, blueprint) => {
    const tagGroups = new Set(
      blueprint.responsibilityIds.flatMap((responsibilityId) =>
        findResponsibility(level, responsibilityId).tags,
      ),
    );
    return breaks + Math.max(0, tagGroups.size - 1);
  }, 0);
}

export interface BlueprintVerdict {
  radii: BlastRadius[];
  worstRadius: number;
  targetBlastRadius: number;
  emptyBlueprintCount: number;
  cleared: boolean;
}

export function evaluate(system: BlueprintSystem, level: BlueprintLevel): BlueprintVerdict {
  const radii = level.changeRequests.map((changeRequest) =>
    computeBlastRadius(system, level, changeRequest),
  );
  const worstRadius = radii.reduce((worst, radius) => Math.max(worst, radius.total), 0);
  const emptyBlueprintCount = system.blueprints.filter(
    (blueprint) => blueprint.responsibilityIds.length === 0,
  ).length;

  return {
    radii,
    worstRadius,
    targetBlastRadius: level.targetBlastRadius,
    emptyBlueprintCount,
    cleared: worstRadius <= level.targetBlastRadius && emptyBlueprintCount === 0,
  };
}
