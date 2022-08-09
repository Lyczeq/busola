import React, { createContext, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import * as jp from 'jsonpath';
import jsonata from 'jsonata';
import { EMPTY_TEXT_PLACEHOLDER } from 'shared/constants';
import { OrderedMap } from 'immutable';
import { Link } from 'shared/components/Link/Link';

export const TranslationBundleContext = createContext({
  translationBundle: 'extensibility',
  defaultResourcePlaceholder: '',
});

export const getValue = (resource, path) => {
  if (!resource) return undefined;
  if (!path || path === '$') return resource;

  if (path.startsWith('$.')) {
    return jp.value(resource, path);
  } else if (path.startsWith('[')) {
    return jp.value(resource, '$' + path);
  }
  return jp.value(resource, '$.' + path);
};

export const applyFormula = (value, formula, t, additionalSources) => {
  try {
    const expression = jsonata(formula);
    return expression.evaluate({ data: value, ...additionalSources });
  } catch (e) {
    return t('extensibility.configuration-error', { error: e.message });
  }
};

export const useGetTranslation = path => {
  const { translationBundle } = useContext(TranslationBundleContext);
  const { t, i18n } = useTranslation([translationBundle]);
  //doesn't always work, add `translationBundle.` at the beginning of a path
  return {
    t: (path, ...props) => t(`${translationBundle}::${path}`, ...props) || path,
    tFromStoreKeys: (storeKeys, ...props) => {
      const path = storeKeys
        .toArray()
        .filter(el => typeof el === 'string') // get rid of numbers i.e. spec.ports[2].protocol
        .join('.');

      return t(`${translationBundle}::${path}`, ...props) || path;
    },
    widgetT: (def, options = {}) => {
      const items = Array.isArray(def) ? def : [def];
      const path = items.map(item => item.name || item.path).join('.');
      return t(`${translationBundle}::${path}`, {
        ...options,
        defaultValue: path,
      });
    },
    exists: path => i18n.exists(`${translationBundle}:${path}`),
    i18n,
  };
};

export function createTemplate(api, namespace, scope) {
  const { version, group, kind } = api;
  const apiVersion = group ? `${group}/${version}` : version;

  const template = {
    apiVersion,
    kind,
    metadata: {
      name: '',
      labels: {},
      annotations: {},
    },
    spec: {},
  };
  if (namespace && scope === 'namespace')
    template.metadata.namespace = namespace;
  return template;
}

export const useGetPlaceholder = structure => {
  const { t } = useGetTranslation();
  const { defaultResourcePlaceholder } = useContext(TranslationBundleContext);

  let emptyLeafPlaceholder = '';
  if (structure?.placeholder) {
    emptyLeafPlaceholder = t(structure.placeholder);
  } else if (defaultResourcePlaceholder) {
    emptyLeafPlaceholder = t(defaultResourcePlaceholder);
  } else {
    emptyLeafPlaceholder = EMPTY_TEXT_PLACEHOLDER;
  }

  return { emptyLeafPlaceholder };
};

export const getObjectValueWorkaround = (
  schema,
  resource,
  storeKeys,
  value,
) => {
  // TODO the value obtained by ui-schema is undefined for this component
  if (schema.toJS().type === 'object') {
    value = OrderedMap(
      storeKeys.toArray().reduce((valueSoFar, currKey) => {
        return valueSoFar?.[currKey];
      }, resource),
    );
  }

  return value;
};

export const useCreateResourceDescription = descID => {
  const { t, i18n } = useGetTranslation();

  let trans = t(descID);

  if (typeof trans === 'string') {
    const i18VarRegex = /{{.*?}}/g;
    const matchesIterator = trans?.matchAll(i18VarRegex);
    const matches = matchesIterator ? [...matchesIterator].flat() : null;

    if (matches.length) {
      matches.forEach((link, inx) => {
        const linkText = link.match(/\[(.*?)]/)[1];
        trans = trans.replace(link, `<${inx}>${linkText}</${inx}>`);
      });
      return (
        <Trans
          i18nKey={trans}
          i18n={i18n}
          components={matches.map((result, idx) => {
            const url = result.match(/\((.*?)\)/)[1];

            return <Link className="fd-link" url={url} key={idx} />;
          })}
        />
      );
    } else {
      return trans;
    }
  }
};

export const throwConfigError = (message, code) => {
  const e = new Error(message, { cause: code });
  e.name = 'Extensibility Config Error';
  throw e;
};

export const applySortFormula = (formula, t) => {
  try {
    const sortFunction = jsonata(formula);
    sortFunction.registerFunction('compareStrings', (a, b) => {
      return a?.localeCompare(b) ?? 1;
    });

    return (a, b) => {
      // sortFunction.assign('first', a);
      // sortFunction.assign('second', b);
      // if (a === undefined && b === undefined) return 0;
      if (a === undefined) return -1;
      if (b === undefined) return 1;
      // console.log('second', b);
      // console.log(sortFunction.evaluate());
      return sortFunction.evaluate();
    };
  } catch (e) {
    return t('extensibility.configuration-error', { error: e.message });
  }
};

export const getSortingFunction = child => {
  const { path, formula } = child;
  return (a, b) => {
    const aValue = getValue(a, path);
    const bValue = getValue(b, path);

    switch (typeof aValue) {
      case 'number':
      case 'boolean':
      case 'undefined': {
        if (aValue === undefined) return -1;
        if (bValue === undefined) return 1;
        return aValue - bValue;
      }
      case 'string': {
        if (Date.parse(aValue)) {
          return new Date(aValue).getTime() - new Date(bValue).getTime();
        }
        return aValue.localeCompare(bValue);
      }
      default:
        if (!formula) {
          const parsedValueA = JSON.parse(aValue);
          const parsedValueB = JSON.parse(bValue);
          return parsedValueA.localeCompare(parsedValueB);
        }
        const aFormula = applyFormula(aValue, formula);
        const bFormula = applyFormula(bValue, formula);

        return aFormula - bFormula;
    }
  };
};

export const sortBy = (
  sortChildren,
  t,
  defaultSortOptions = {},
  pathPrefix = '',
) => {
  let defaultSort = {};
  const sortingOptions = sortChildren.reduce((acc, child) => {
    const sortName = child.name || t(`${pathPrefix}${child.path}`);
    let sortFn = getSortingFunction(child);

    if (child.sort.fn) {
      sortFn = (a, b) => {
        const aValue = getValue(a, child.path);
        const bValue = getValue(b, child.path);
        const sortFormula = applySortFormula(child.sort.fn, t);
        return sortFormula(aValue, bValue);
      };
    }

    if (child.sort.default) {
      defaultSort[sortName] = sortFn;
      return { ...acc };
    } else {
      acc[sortName] = sortFn;
      return { ...acc };
    }
  }, {});

  return { ...defaultSort, ...defaultSortOptions, ...sortingOptions };
};
