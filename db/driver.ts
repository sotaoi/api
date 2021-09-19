import type { Decimal128, ObjectId, Mixed } from 'mongoose';
import { Schema } from 'mongoose';

type FieldType =
  | StringConstructor
  | NumberConstructor
  | DateConstructor
  | typeof Buffer // <-- is this ok? see mongoose classes and type defs
  | Boolean
  | Mixed
  | ObjectId
  | Array<any>
  | Decimal128
  | Map<any, any>;

interface FieldSchemaInit {
  [key: string]: {
    type: FieldType;
    index?: { unique?: boolean };
  };
}

class FieldSchema extends Schema {
  protected fieldSchema: FieldSchemaInit;

  constructor(fieldSchema: FieldSchemaInit) {
    super(fieldSchema);
    this.fieldSchema = fieldSchema;
  }
}

export { FieldSchema };
export type { FieldType, FieldSchemaInit };
export * from 'mongoose';
export { model as dbModel, Model as DbModel } from 'mongoose';
