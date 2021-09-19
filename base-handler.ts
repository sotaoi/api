import { Artifact, AuthRecord } from '@sotaoi/omni/artifacts';
import { PermissionCheck } from '@sotaoi/api/contracts/permissions';
import { permissions } from '@sotaoi/api/permissions';
import { ResponseToolkit } from '@hapi/hapi';
import { Model } from '@sotaoi/api/db/model';
import { Store } from '@sotaoi/api/store';

abstract class BaseHandler {
  public handler: ResponseToolkit;

  constructor(handler: ResponseToolkit) {
    this.handler = handler;
  }

  public requireArtifact(artifact: null | Artifact): PermissionCheck {
    return permissions().install(artifact);
  }

  public driverArtifact(repository: string, uuid: string, pocket: { [key: string]: any }): Artifact {
    return new Artifact(Model.drivername(), repository, uuid, pocket);
  }

  public mdriverArtifact(repository: string, uuid: string, pocket: { [key: string]: any }): Artifact {
    return new Artifact(Model.mdrivername(), repository, uuid, pocket);
  }

  public sdriverArtifact(repository: string, uuid: string, pocket: { [key: string]: any }): Artifact {
    return new Artifact(Model.sdrivername(), repository, uuid, pocket);
  }

  public driverAuthRecord(
    repository: string,
    uuid: string,
    createdAt: Date,
    active: boolean,
    pocket: { [key: string]: any },
  ): AuthRecord {
    return new AuthRecord(Model.drivername(), repository, uuid, createdAt, active, pocket);
  }

  public mdriverAuthRecord(
    repository: string,
    uuid: string,
    createdAt: Date,
    active: boolean,
    pocket: { [key: string]: any },
  ): AuthRecord {
    return new AuthRecord(Model.mdrivername(), repository, uuid, createdAt, active, pocket);
  }

  public sdriverAuthRecord(
    repository: string,
    uuid: string,
    createdAt: Date,
    active: boolean,
    pocket: { [key: string]: any },
  ): AuthRecord {
    return new AuthRecord(Model.sdrivername(), repository, uuid, createdAt, active, pocket);
  }

  public driverDomainRepoSignature(repository: string): string {
    return Store.driverDomainRepoSignature(repository);
  }

  public mdriverDomainRepoSignature(repository: string): string {
    return Store.mdriverDomainRepoSignature(repository);
  }

  public sdriverDomainRepoSignature(repository: string): string {
    return Store.sdriverDomainRepoSignature(repository);
  }
}

export { BaseHandler };
