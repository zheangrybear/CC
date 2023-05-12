/* eslint-disable no-param-reassign, no-self-assign, array-callback-return */
/**
 * Base on https://github.com/umijs//Users/jiefeng/Projects/xiemala/web/node_modules/umi-request
 */
// decoupling with antd UI library, you can using `alias` modify the ui methods
import Router from 'next/router';
import { getIntl } from 'plugin-locale';
import { extend } from 'umi-request';

import { debouncedMessage } from '@/utils/crypto';
import storage from '@/utils/storage';
import { tokenGet } from '@/utils/token';
import { apiURL } from '@/utils/url';
import { isBrowser } from '@/utils/utils';

import type {
  Context,
  ErrorInfoStructure,
  RequestConfig,
  RequestError,
  RequestMethod,
  RequestMethodInUmi,
  ResponseError,
} from './index';

export enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 4,
  REDIRECT = 9,
}
const DEFAULT_ERROR_PAGE = '/exception';

let requestMethodInstance: RequestMethod;
const getRequestMethod = () => {
  if (requestMethodInstance) {
    // request method 已经示例化
    return requestMethodInstance;
  }

  // const codeMessage = {
  //   200: '服务器成功返回请求的数据。',
  //   201: '新建或修改数据成功。',
  //   202: '一个请求已经进入后台排队（异步任务）。',
  //   204: '删除数据成功。',
  //   303: '建议客户访问其他URL或访问方式。', // StatusSeeOther
  //   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  //   401: '用户没有权限（令牌、用户名、密码错误）。',
  //   403: '用户得到授权，但是访问是被禁止的。',
  //   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  //   405: '请求方法不被允许。',
  //   406: '请求的格式不可得。',
  //   409: '由于请求和资源的当前状态相冲突，因此请求不能成功。',
  //   410: '请求的资源被永久删除，且不会再得到的。',
  //   422: '当创建一个对象时，发生一个验证错误。',
  //   500: '服务器发生错误，请检查服务器。',
  //   502: '网关错误。',
  //   503: '服务不可用，服务器暂时过载或维护。',
  //   504: '网关超时。',
  // };

  /** 异常处理程序
   * @see https://beta-pro.ant.design/docs/request-cn
   */
  const errorHandler = (error: ResponseError) => {
    const { response } = error;
    if (response && response.status) {
      const intl = getIntl();
      const hasErrMsg = error.data && error.data.message && intl;
      if (
        isBrowser() &&
        hasErrMsg &&
        process.env.NEXT_PUBLIC_PRODUCTION !== 'no' &&
        process.env.NODE_ENV === 'production'
      ) {
        debouncedMessage(
          intl.formatMessage({ id: error.data.message }),
          response.status < 500 && response.status >= 400 ? 'warning' : 'error'
        );
        throw error;
      }

      const { status, url } = response;
      if (status === 303) {
        return;
      }

      if (
        isBrowser() &&
        !hasErrMsg &&
        process.env.NEXT_PUBLIC_PRODUCTION !== 'no' &&
        process.env.NODE_ENV === 'production'
      ) {
        debouncedMessage(`${status}: ${url}`, status < 500 && status >= 400 ? 'warning' : 'error');
      }
    }

    if (
      isBrowser() &&
      !response &&
      process.env.NEXT_PUBLIC_PRODUCTION !== 'no' &&
      process.env.NODE_ENV === 'production'
    ) {
      debouncedMessage('您的网络发生异常，无法连接服务器', 'error');
    }
    throw error;
  };

  const setHeader = (ctx: any, key: string, value: any) => {
    if (value) {
      const { options } = ctx.req;
      if (!options.headers) {
        options.headers = new Headers();
      }
      if (options.headers instanceof Headers) {
        options.headers.set(key, value);
      } else if (options.headers) {
        (options.headers as Record<string, string>)[key] = value;
      }
    }
  };

  // runtime 配置可能应为依赖顺序的问题在模块初始化的时候无法获取，所以需要封装一层在异步调用后初始化相关方法
  // 当用户的 app.ts 中依赖了该文件的情况下就该模块的初始化时间就会被提前，无法获取到运行时配置
  const requestConfig: RequestConfig = {
    middlewares: [
      // set Authorization header
      async (ctx, next) => {
        setHeader(ctx, 'Authorization', tokenGet());
        setHeader(ctx, 'Language', storage.umi_locale || 'zh-CN');
        setHeader(ctx, 'ClientID', storage.clientID);
        await next();
      },
    ],
    responseInterceptors: [
      async (response) => {
        const text = await response.clone().text();
        switch (response.status) {
          case 303:
            if (process.browser) {
              window.location.href = text;
            }
            return response;
          default:
            return response;
        }
      },
    ],
    errorHandler,
  };

  const errorAdaptor = requestConfig.errorConfig?.adaptor || ((resData) => resData);

  requestMethodInstance = extend({
    errorHandler: (error: RequestError) => {
      // @ts-ignore
      if (error?.request?.options?.skipErrorHandler) {
        throw error;
      }
      let errorInfo: ErrorInfoStructure | undefined;
      if (error.name === 'ResponseError' && error.data && error.request) {
        const ctx: Context = {
          req: error.request,
          res: error.response,
        };
        errorInfo = errorAdaptor(error.data, ctx);
        error.message = errorInfo?.errorMessage || error.message;
        error.data = error.data;
        error.info = errorInfo;
      }
      errorInfo = error.info;

      if (errorInfo) {
        const errorMessage = errorInfo?.errorMessage;
        const errorCode = errorInfo?.errorCode;
        const errorPage = requestConfig.errorConfig?.errorPage || DEFAULT_ERROR_PAGE;

        switch (errorInfo?.showType) {
          case ErrorShowType.SILENT:
            // do nothing
            break;
          case ErrorShowType.WARN_MESSAGE:
            if (isBrowser()) {
              debouncedMessage(errorMessage ?? '', 'warning');
            }
            break;
          case ErrorShowType.ERROR_MESSAGE:
            if (isBrowser()) {
              debouncedMessage(errorMessage ?? '', 'error');
            }
            break;
          case ErrorShowType.NOTIFICATION:
            if (isBrowser()) {
              debouncedMessage(errorMessage ?? '', 'info');
            }
            break;
          case ErrorShowType.REDIRECT:
            // @ts-ignore
            Router.push({
              pathname: errorPage,
              query: { errorCode, errorMessage },
            });
            // redirect to error page
            break;
          default:
            if (isBrowser()) {
              debouncedMessage(errorMessage ?? '', 'error');
            }
            break;
        }
      } else {
        debouncedMessage(error.message || 'Request error, please retry.', 'error');
      }
      throw error;
    },
    ...requestConfig,
  });

  // 中间件统一错误处理
  // 后端返回格式 { success: boolean, data: any }
  // 按照项目具体情况修改该部分逻辑
  requestMethodInstance.use(async (ctx, next) => {
    await next();
    const { req, res } = ctx;
    // @ts-ignore
    if (req.options?.skipErrorHandler) {
      return;
    }
    const { options } = req;
    const { getResponse } = options;
    const resData = getResponse ? res.data : res;
    const errorInfo = errorAdaptor(resData, ctx);
    if (errorInfo.success === false) {
      // 抛出错误到 errorHandler 中处理
      const error: RequestError = new Error(errorInfo.errorMessage);
      error.name = 'BizError';
      error.data = resData;
      error.info = errorInfo;
      throw error;
    }
  });

  // Add user custom middlewares
  const customMiddlewares = requestConfig.middlewares || [];
  customMiddlewares.forEach((mw) => {
    requestMethodInstance.use(mw);
  });

  // Add user custom interceptors
  const requestInterceptors = requestConfig.requestInterceptors || [];
  const responseInterceptors = requestConfig.responseInterceptors || [];
  requestInterceptors.map((ri) => {
    requestMethodInstance.interceptors.request.use(ri);
  });
  responseInterceptors.map((ri) => {
    requestMethodInstance.interceptors.response.use(ri);
  });

  return requestMethodInstance;
};
const request: RequestMethodInUmi = (url: any, options: any) => {
  const requestMethod = getRequestMethod();
  return requestMethod(apiURL(url), options);
};

export { request };
