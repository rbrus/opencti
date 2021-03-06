import { pipe, assoc } from 'ramda';
import { delEditContext, notify, setEditContext } from '../database/redis';
import {
  createEntity,
  createRelation,
  deleteEntityById,
  deleteRelationById,
  executeWrite,
  listEntities,
  loadEntityById,
  TYPE_STIX_DOMAIN,
  updateAttribute,
} from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';

export const findById = (externalReferenceId) => {
  return loadEntityById(externalReferenceId, 'External-Reference');
};
export const findAll = (args) => {
  return listEntities(['External-Reference'], ['source_name', 'description'], args);
};

export const addExternalReference = async (user, externalReference) => {
  const created = await createEntity(externalReference, 'External-Reference', { modelType: TYPE_STIX_DOMAIN });
  return notify(BUS_TOPICS.ExternalReference.ADDED_TOPIC, created, user);
};

export const externalReferenceDelete = async (externalReferenceId) => {
  return deleteEntityById(externalReferenceId, 'External-Reference');
};
export const externalReferenceAddRelation = (user, externalReferenceId, input) => {
  const finalInput = pipe(assoc('through', 'external_references'), assoc('toType', 'External-Reference'))(input);
  return createRelation(externalReferenceId, finalInput).then((relationData) => {
    notify(BUS_TOPICS.ExternalReference.EDIT_TOPIC, relationData, user);
    return relationData;
  });
};
export const externalReferenceDeleteRelation = async (user, externalReferenceId, relationId) => {
  await deleteRelationById(relationId, 'stix_relation_embedded');
  const data = await loadEntityById(externalReferenceId, 'External-Reference');
  return notify(BUS_TOPICS.ExternalReference.EDIT_TOPIC, data, user);
};
export const externalReferenceEditField = (user, externalReferenceId, input) => {
  return executeWrite((wTx) => {
    return updateAttribute(externalReferenceId, 'External-Reference', input, wTx);
  }).then(async () => {
    const externalReference = await loadEntityById(externalReferenceId, 'External-Reference');
    return notify(BUS_TOPICS.ExternalReference.EDIT_TOPIC, externalReference, user);
  });
};

export const externalReferenceCleanContext = (user, externalReferenceId) => {
  delEditContext(user, externalReferenceId);
  return loadEntityById(externalReferenceId, 'External-Reference').then((externalReference) =>
    notify(BUS_TOPICS.ExternalReference.EDIT_TOPIC, externalReference, user)
  );
};
export const externalReferenceEditContext = (user, externalReferenceId, input) => {
  setEditContext(user, externalReferenceId, input);
  return loadEntityById(externalReferenceId, 'External-Reference').then((externalReference) =>
    notify(BUS_TOPICS.ExternalReference.EDIT_TOPIC, externalReference, user)
  );
};
