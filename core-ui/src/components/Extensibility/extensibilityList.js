// import React from 'react';
// import { getValue } from './components/helpers';
// import { useGetCRbyPath } from './useGetCRbyPath';
// import { ResourcesList } from 'shared/components/ResourcesList/ResourcesList';
// import { ExtensibilityCreate } from './extensibilityCreate';
// import { Labels } from 'shared/components/Labels/Labels';
// import { EMPTY_TEXT_PLACEHOLDER } from 'shared/constants';
// import { Link } from 'shared/components/Link/Link';
// import { StatusBadge } from 'shared/components/StatusBadge/StatusBadge';
// import { usePrepareListProps } from 'resources/helpers';
// import { useTranslation } from 'react-i18next';

// function resolveBadgeType(value, columnProps) {
//   const { successValues, warningValues } = columnProps;
//   if ((successValues || []).includes(value)) {
//     return 'success';
//   } else if ((warningValues || []).includes(value)) {
//     return 'warning';
//   }
//   return undefined;
// }

// function listColumnDisplay(value, columnProps) {
//   const { display, arrayValuePath } = columnProps;
//   switch (display) {
//     case 'labels':
//       return <Labels labels={value} />;
//     case 'array':
//       if (Array.isArray(value)) {
//         return (value || []).map(v => getValue(v, arrayValuePath)).join(', ');
//       } else {
//         return '';
//       }
//     case 'external-link':
//       return <Link url={value}>{value}</Link>;
//     case 'status':
//       return (
//         <StatusBadge type={resolveBadgeType(value, columnProps)}>
//           {value}
//         </StatusBadge>
//       );
//     default:
//       return JSON.stringify(value);
//   }
// }

// export const ExtensibilityList = () => {
//   const resource = useGetCRbyPath();

//   const translationBundle = resource?.navigation?.path || 'extensibility';
//   const { t: translations } = useTranslation([translationBundle]); //doesn't always work, add `translationBundle.` at the beggining of a path
//   const t = (path, ...props) =>
//     translations(`${translationBundle}:${path}`, ...props);

//   const listProps = usePrepareListProps(
//     resource.navigation.path,
//     resource.navigation.label,
//   );

//   if (resource.resource?.kind) {
//     listProps.resourceUrl = listProps.resourceUrl.replace(
//       /[a-z0-9-]+\/?$/,
//       (resource.resource?.kind).toLowerCase(),
//     );
//   }
//   listProps.createFormProps = { resource };
//   listProps.resourceName = t('labels.name', {
//     defaultValue: resource.navigation.label,
//   });
//   listProps.description = t('labels.description', {
//     defaultValue: '',
//   });
//   listProps.customColumns = (resource.list.columns || []).map(column => ({
//     header: t(column.valuePath, {
//       defaultValue: column.valuePath?.split('.')?.pop(),
//     }),
//     value: resource => {
//       const v = listColumnDisplay(getValue(resource, column.valuePath), column);
//       if (typeof v === 'undefined' || v === '') {
//         return EMPTY_TEXT_PLACEHOLDER;
//       } else {
//         return v;
//       }
//     },
//   }));
//   return (
//     <ResourcesList createResourceForm={ExtensibilityCreate} {...listProps} />
//   );
// };

import React from 'react';
import { useGetCRbyPath } from './useGetCRbyPath';

import { getValue } from './components/helpers';
import { ResourcesList } from 'shared/components/ResourcesList/ResourcesList';
import { ExtensibilityCreate } from './extensibilityCreate';
import { Labels } from 'shared/components/Labels/Labels';
import { EMPTY_TEXT_PLACEHOLDER } from 'shared/constants';
import { StatusBadge } from 'shared/components/StatusBadge/StatusBadge';
import { usePrepareListProps } from 'resources/helpers';
import { useTranslation } from 'react-i18next';

const ColumnHandler = ({ value, columnProps }) => {
  if (!value) return EMPTY_TEXT_PLACEHOLDER;

  const { widget } = columnProps;

  if (!widget) return <BasicRenderer value={value} />;

  switch (widget.toLowerCase()) {
    case 'status':
      return <CustomStatus value={value} />;
    case 'link':
      return <ExternalLink />;
    case 'labels':
      return <Labels labels={value} />;
    default:
      JSON.stringify(value);
  }
};

const ExternalLink = ({ resourceKind, namespace }) => {};

const CustomStatus = ({ value }) => {
  return <StatusBadge>{value}</StatusBadge>;
};

const BasicRenderer = ({ value }) => {
  if (typeof value === 'string' || typeof value === 'number')
    return value || EMPTY_TEXT_PLACEHOLDER;

  if (typeof value === 'boolean') return value.toString();
};

export const ExtensibilityList = () => {
  const resource = useGetCRbyPath();

  const translationBundle = resource?.navigation?.path || 'extensibility';
  const { t: translations } = useTranslation([translationBundle]); //doesn't always work, add `translationBundle.` at the beggining of a path
  const t = (path, ...props) =>
    translations(`${translationBundle}:${path}`, ...props);

  const listProps = usePrepareListProps(
    resource.navigation.path,
    resource.navigation.label,
  );

  if (resource.resource?.kind) {
    listProps.resourceUrl = listProps.resourceUrl.replace(
      /[a-z0-9-]+\/?$/,
      (resource.resource?.kind).toLowerCase(),
    );
  }

  listProps.createFormProps = { resource };

  listProps.resourceName = t('labels.name', {
    defaultValue: resource.navigation.label,
  });

  listProps.description = t('labels.description', {
    defaultValue: '',
  });

  listProps.customColumns = resource?.list.columns.map(column => ({
    header: t(column.path, {
      defaultValue: column.path?.split('.')?.pop(),
    }),
    value: resource => (
      <ColumnHandler
        value={getValue(resource, column.path)}
        columnProps={column}
      />
    ),
  }));

  return (
    <ResourcesList createResourceForm={ExtensibilityCreate} {...listProps} />
  );
};
