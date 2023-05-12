import enUS0 from 'antd/lib/locale/en_US';
import jaJP0 from 'antd/lib/locale/ja_JP';
import zhCN0 from 'antd/lib/locale/zh_CN';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import { createIntl } from 'react-intl';
import warning from 'warning/warning.js';

import lang_enUS0 from '@/locales/en-US';
import lang_jaJP0 from '@/locales/ja-JP';
import lang_zhCN0 from '@/locales/zh-CN';
import storage from '@/utils/storage';

import { event, LANG_CHANGE_EVENT } from './locale';

export { createIntl };
export {
  createIntlCache,
  defineMessages,
  FormattedDate,
  FormattedDateParts,
  FormattedDisplayName,
  FormattedList,
  FormattedMessage,
  FormattedNumber,
  FormattedNumberParts,
  FormattedPlural,
  FormattedRelativeTime,
  FormattedTime,
  FormattedTimeParts,
  injectIntl,
  IntlContext,
  IntlProvider,
  RawIntlProvider,
  useIntl,
} from 'react-intl';

let g_intl: IntlShape;

const useLocalStorage = true;

export const localeInfo: Record<string, any> = {
  'en-US': {
    messages: {
      ...lang_enUS0,
    },
    locale: 'en-US',
    antd: {
      ...enUS0,
    },
    momentLocale: '',
  },
  'zh-CN': {
    messages: {
      ...lang_zhCN0,
    },
    locale: 'zh-CN',
    antd: {
      ...zhCN0,
    },
    momentLocale: 'zh-cn',
  },
  'ja-JP': {
    messages: {
      ...lang_jaJP0,
    },
    locale: 'ja-JP',
    antd: {
      ...jaJP0,
    },
    momentLocale: '',
  },
};

/**
 * 增加一个新的国际化语言
 * @param name 语言的 key
 * @param messages 对应的枚举对象
 * @param extraLocale momentLocale, antd 国际化
 */
export const addLocale = (
  name: string,
  messages: Record<string, string>,
  extraLocales: {
    momentLocale: string;
    antd: string;
  }
) => {
  if (!name) {
    return;
  }
  // 可以合并
  const mergeMessages = localeInfo[name]?.messages ? { ...localeInfo[name].messages, ...messages } : messages;

  const { momentLocale, antd } = extraLocales || {};
  localeInfo[name] = {
    messages: mergeMessages,
    locale: name.split('-')?.join('-'),
    momentLocale,
    antd,
  };
};

/**
 * 获取当前的 intl 对象，可以在 node 中使用
 * @param locale 需要切换的语言类型
 * @param changeIntl 是否不使用 g_intl
 * @returns IntlShape
 */
export const getIntl = (locale?: string, changeIntl?: boolean) => {
  // 如果全局的 g_intl 存在，且不是 setIntl 调用
  if (g_intl && !changeIntl && !locale) {
    return g_intl;
  }
  // 如果存在于 localeInfo 中
  if (locale && localeInfo[locale]) {
    return createIntl(localeInfo[locale]);
  }
  // 不存在需要一个报错提醒
  warning(
    !locale || !!localeInfo[locale],
    `The current popular language does not exist, please check the locales folder!`
  );
  // 使用 zh-CN
  if (localeInfo['zh-CN']) return createIntl(localeInfo['zh-CN']);

  // 如果还没有，返回一个空的
  return createIntl({
    locale: 'zh-CN',
    messages: {},
  });
};

/**
 * 切换全局的 intl 的设置
 * @param locale 语言的key
 */
export const setIntl = (locale: string) => {
  g_intl = getIntl(locale, true);
};

/**
 * 获取当前选择的语言
 * @returns string
 */
export const getLocale = () => {
  // please clear localStorage if you change the baseSeparator config
  // because changing will break the app
  const lang = typeof localStorage !== 'undefined' && useLocalStorage ? window.localStorage.getItem('umi_locale') : '';
  // support baseNavigator, default true
  const isNavigatorLanguageValid = typeof navigator !== 'undefined' && typeof navigator.language === 'string';
  const browserLang = isNavigatorLanguageValid ? navigator.language.split('-').join('-') : '';
  return lang || browserLang || 'zh-CN';
};

/**
 * 获取当前选择的方向
 * @returns string
 */
export const getDirection = () => {
  const lang = getLocale();
  // array with all prefixs for rtl langueges ex: ar-EG , he-IL
  const rtlLangs = ['he', 'ar', 'fa', 'ku'];
  const direction = rtlLangs.filter((lng) => lang.startsWith(lng)).length ? 'rtl' : 'ltr';
  return direction;
};

/**
 * 切换语言
 * @param lang 语言的 key
 * @param realReload 是否刷新页面，默认刷新
 * @returns string
 */
export const setLocale = (lang: string, realReload: boolean = true) => {
  const localeExp = /^([a-z]{2})-?([A-Z]{2})?$/;

  const updater = () => {
    if (lang !== undefined && !localeExp.test(lang)) {
      // for reset when lang === undefined
      throw new Error('setLocale lang format error');
    }
    if (getLocale() !== lang) {
      if (typeof window.localStorage !== 'undefined' && useLocalStorage) {
        storage.umi_locale = lang || '';
      }
      setIntl(lang);
      if (realReload) {
        window.location.reload();
      } else {
        event.emit(LANG_CHANGE_EVENT, lang);
        // chrome 不支持这个事件。所以人肉触发一下
        if (window.dispatchEvent) {
          const e = new Event('languagechange');
          window.dispatchEvent(e);
        }
      }
    }
  };

  updater();
};

let firstWaring = true;

/**
 * intl.formatMessage 的语法糖
 * @deprecated 使用此 api 会造成切换语言的时候无法自动刷新，请使用 useIntl 或 injectIntl
 * @param descriptor { id : string, defaultMessage : string }
 * @param values { [key:string] : string }
 * @returns string
 */
export const formatMessage: IntlShape['formatMessage'] = (descriptor: MessageDescriptor, values: any) => {
  if (firstWaring) {
    warning(
      false,
      `Using this API will cause automatic refresh when switching languages, please use useIntl or injectIntl.

使用此 api 会造成切换语言的时候无法自动刷新，请使用 useIntl 或 injectIntl。

http://j.mp/37Fkd5Q
      `
    );
    firstWaring = false;
  }
  return g_intl.formatMessage(descriptor, values);
};

/**
 * 获取语言列表
 * @returns string[]
 */
export const getAllLocales = () => Object.keys(localeInfo);
