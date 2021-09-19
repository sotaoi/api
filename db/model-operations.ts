import type { Model as ModelType } from '@sotaoi/api/db/model';
import type { DatabaseConnection } from '@sotaoi/omni/definitions/mdriver';
import { GenericModel } from '@sotaoi/api/db/generic-model';
import { dbModel, DbModel, Schema } from '@sotaoi/api/db/driver';

class ModelOperations {
  protected model: ModelType;
  protected static models: { [key: string]: ModelType } = {};
  protected static dbModels: { [key: string]: DbModel<any> } = {};
  protected static dynamicDbModels: { [key: string]: DbModel<any> } = {};

  constructor(model: ModelType) {
    this.model = model;
    if (model instanceof GenericModel) {
      return;
    }
    !ModelOperations.models[model.repository()] && (ModelOperations.models[model.repository()] = model);
    !ModelOperations.dbModels[model.repository()] &&
      (ModelOperations.dbModels[model.repository()] = dbModel(
        model.repository(),
        new Schema(
          {
            ...model.schema(),
            uuid: {
              type: String,
              index: {
                unique: true,
              },
            },
            createdAt: {
              type: Date,
            },
            updatedAt: {
              type: Date,
            },
          },
          {
            collection: model.repository(),
            strict: model.isStrict(),
            timestamps: true,
          },
        ),
      ));
  }

  public static get(model: string): DbModel<any> {
    if (this.dbModels[model]) {
      return this.dbModels[model];
    }
    if (this.dynamicDbModels[model]) {
      return this.dynamicDbModels[model];
    }
    this.dynamicDbModels[model] = dbModel(
      'dynamic_' + model,
      new Schema(GenericModel.genericSchema(), {
        collection: model,
        strict: false,
        timestamps: true,
      }),
    );
    return this.dynamicDbModels[model];
  }

  public static mget(model: string): DatabaseConnection.QueryBuilder {
    const { Model } = require('@sotaoi/api/db/model');
    return (Model as typeof ModelType).mdriver()(model);
  }

  public async cleanupDocs(): Promise<void> {
    // const model = ModelOperations.get(this.model.repository(), false);
    // await model.deleteMany({
    //   $or: [
    //     { uuid: { $exists: false } },
    //     { uuid: null },
    //     { uuid: '' },
    //     { createdAt: { $exists: false } },
    //     { createdAt: null },
    //     { createdAt: '' },
    //   ],
    // });
  }
}

export { ModelOperations };
