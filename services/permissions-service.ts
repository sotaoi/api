import { Permissions, PermissionCheck, PermissionCheckFns } from '@sotaoi/api/contracts/permissions';
import { Artifact } from '@sotaoi/omni/artifacts';

class PermissionCheckService extends PermissionCheck {
  protected permissioned: null | Artifact;

  constructor(permissioned: null | Artifact) {
    super();
    this.permissioned = permissioned;
  }

  public is(role: null | string, type: string): PermissionCheckFns<boolean> {
    return {
      with: async (artifact: null | Artifact): Promise<boolean> => {
        // !!
        return false;
      },
      for: async (artifact: null | Artifact): Promise<boolean> => {
        // !!
        return false;
      },
    };
  }

  public async ofType(type: string): Promise<boolean> {
    if (!this.permissioned) {
      return false;
    }
    return this.permissioned.repository === type;
  }

  public async ofTypes(types: string[]): Promise<boolean> {
    if (!this.permissioned) {
      return false;
    }
    for (const type of types) {
      if (this.permissioned.repository === type) {
        return true;
      }
    }
    return false;
  }
}

class PermissionsService extends Permissions {
  public install(permissioned: null | Artifact): PermissionCheckService {
    return new PermissionCheckService(permissioned);
  }
}

export { PermissionsService };
