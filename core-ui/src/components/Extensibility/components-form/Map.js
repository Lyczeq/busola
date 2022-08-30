import React from 'react';
import { PluginStack, useUIStore } from '@ui-schema/ui-schema';
import { Button, MultiInput } from 'fundamental-react';
import { useTranslation } from 'react-i18next';
import { createOrderedMap } from '@ui-schema/ui-schema/Utils/createMap';
import { ResourceForm } from 'shared/ResourceForm';
import { useGetTranslation } from 'components/Extensibility/helpers';
import { getObjectValueWorkaround } from 'components/Extensibility/helpers';
import { StringRenderer } from './StringRenderer';
import { Input } from 'components/Functions/FunctionDetails/Tabs/ResourceManagement/TableElements/Input';
import { KeyValueField } from 'shared/ResourceForm/fields';
import pluralize from 'pluralize';
export function Map({
  storeKeys,
  schema,
  value,
  onChange,
  required,
  resource,
  readOnly,
  schemaKeys,
  level,
}) {
  const { t } = useTranslation();
  const { tFromStoreKeys, t: tExt } = useGetTranslation();
  // const schemaPlaceholder = schema.get('placeholder');
  // TODO the value obtained by ui-schema is undefined for this component
  value = getObjectValueWorkaround(schema, resource, storeKeys, value);
  let objectEntries = [[], {}];
  try {
    objectEntries = Object.entries(value?.toJS() || {});
  } catch (error) {
    objectEntries = [[], {}];
  }

  const listSize = objectEntries?.size || 0;

  const addItem = index => {
    onChange({
      storeKeys,
      scopes: ['value'],
      type: 'set',
      schema,
      required,
      data: { value: createOrderedMap({ ...value.toJS(), '': {} }) },
    });
  };

  const removeItem = key => {
    onChange({
      storeKeys,
      scopes: ['value'],
      type: 'set',
      schema,
      required,
      data: () => {
        const x = value.toJS();
        delete x[key];
        return { x: createOrderedMap({ ...x }) };
      },
    });
  };

  // return (
  //   <div>
  //     <div>val {JSON.stringify(value)}</div>
  //     <div>path {path}</div>
  //   </div>
  // );

  // [ [ "a", {"exact": "xd"}]]

  console.log(objectEntries);

  return (
    <ResourceForm.CollapsibleSection
      container
      title={tFromStoreKeys(storeKeys, schema)}
      actions={setOpen => (
        <Button
          glyph="add"
          compact
          onClick={() => {
            addItem(listSize + 1);
            setOpen(true);
          }}
          disabled={readOnly}
        >
          {t('common.buttons.add')}
        </Button>
      )}
    >
      {objectEntries.map((_val, index) => {
        const ownKeys = storeKeys.push(index);
        const itemsSchema = schema.get('items');
        return (
          <>
            <ResourceForm.CollapsibleSection
              title={pluralize(tFromStoreKeys(ownKeys, schema), 1)}
              actions={
                <Button
                  compact
                  glyph="delete"
                  type="negative"
                  onClick={() => {
                    removeItem(_val[0]);
                  }}
                  disabled={readOnly}
                />
              }
            >
              {JSON.stringify(objectEntries)}
              {/* <KeyValueField
              value={value}
              setValue={value => {
                onChange({
                  storeKeys,
                  scopes: ['value'],
                  type: 'set',
                  schema,
                  required,
                  data: { value: createOrderedMap(value) },
                });
              }}
              required={required}
            /> */}
            </ResourceForm.CollapsibleSection>
          </>
        );
      })}
    </ResourceForm.CollapsibleSection>
  );
}
