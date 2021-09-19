import { Artifact } from '@sotaoi/omni/artifacts';

interface PermissionCheckFns<state extends boolean> {
  with(artifact: null | Artifact): Promise<state>;
  for(artifact: null | Artifact): Promise<state>;
}

abstract class PermissionCheck {
  abstract is(role: null | string, type: string): PermissionCheckFns<boolean>;
  abstract ofType(type: string): Promise<boolean>;
  abstract ofTypes(types: string[]): Promise<boolean>;
}

abstract class Permissions {
  abstract install(authRecord: null | Artifact): PermissionCheck;
}

export { Permissions, PermissionCheck };
export type { PermissionCheckFns };
