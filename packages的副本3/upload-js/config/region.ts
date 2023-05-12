/** 上传区域 */
export const region = {
  z0: 'z0',
} as const;

/** 上传区域对应的 host */
export const regionUphostMap = {
  [region.z0]: {
    srcUphost: ['localhost:8081'],
    cdnUphost: [''],
  },
} as const;
