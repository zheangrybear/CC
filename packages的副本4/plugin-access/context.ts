import React from 'react';

import type accessFactory from '@/access';

export type AccessInstance = ReturnType<typeof accessFactory>;

const AccessContext = React.createContext<AccessInstance>(null!);

export default AccessContext;
