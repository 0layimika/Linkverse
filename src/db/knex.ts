import Knex from 'knex';
import { Model } from 'objection';
import knexConfig from './knexfile';

const knex = Knex(knexConfig.development);

// Bind all Objection.js models to knex
Model.knex(knex);

export default knex;
