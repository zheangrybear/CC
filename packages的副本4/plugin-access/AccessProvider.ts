// @ts-nocheck
import { useModel } from 'plugin-model/useModel';
import React, { useMemo } from 'react';
import type { IRoute } from 'umi';

import accessFactory from '@/access';

import type { AccessInstance } from './context';
import AccessContext from './context';
import { traverseModifyRoutes } from './runtimeUtil';

type Routes = IRoute[];

interface Props {
  routes: Routes;
  children: React.ReactNode;
}

const AccessProvider: React.FC<Props> = (props) => {
  const { children } = props;
  const { initialState } = useModel('@@initialState');

  const access: AccessInstance = useMemo(
    () => accessFactory(initialState as any),
    [initialState]
  );

  if (
    process.env.NODE_ENV === 'development' &&
    (access === undefined || access === null)
  ) {
    console.warn(
      '[plugin-access]: the access instance created by access.ts(js) is nullish, maybe you need check it.'
    );
  }

  return React.createElement(
    AccessContext.Provider,
    { value: access },
    React.cloneElement(children, {
      ...children.props,
      routes: traverseModifyRoutes(props.routes, access),
    })
  );
};

export default AccessProvider;
