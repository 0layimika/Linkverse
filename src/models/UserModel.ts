import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
export class UserModel extends Model {
    static tableName = 'users';

    id!: number;
    email!: string;
    password_hash!: string;
    created_at!: Date;
    verified!: boolean;

    static jsonSchema = {
        type: 'object',
        required: ['email', 'password_hash'],
        properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            password_hash: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            verified: { type: 'boolean' },
        },
    };

    static get relationMappings() {
        return {
            creator: {
                relation: Model.HasOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "users.id",
                    to: "creators.user_id",
                },
            },
        };
    }
}

export type UserModelType = ModelObject<UserModel>;
