import React, { useContext } from 'react';

import type { AccessInstance as AccessInstanceType } from './context';
import AccessContext from './context';
import { traverseModifyRoutes } from './runtimeUtil';

export { traverseModifyRoutes };

export type AccessInstance = AccessInstanceType;

export const useAccess = () => {
  const access = useContext(AccessContext);

  return access;
};
export interface AccessProps {
  accessible: boolean;
  fallback?: React.ReactNode;
}

export const Access: React.FC<AccessProps> = (props) => {
  const { accessible, fallback, children } = props;

  return <>{accessible ? children : fallback}</>;
};
