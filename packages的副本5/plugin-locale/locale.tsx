import 'moment/locale/zh-cn';

import { ConfigProvider } from 'antd';
import EventEmitter from 'events';
import moment from 'moment';
import React from 'react';

import { getDirection, getIntl, getLocale, localeInfo, RawIntlProvider, setIntl } from './index';

export const event = new EventEmitter();
event.setMaxListeners(5);
export const LANG_CHANGE_EVENT = Symbol('LANG_CHANGE');

export function onCreate() {
  const locale = getLocale();
  if (moment?.locale) {
    moment.locale(localeInfo[locale]?.momentLocale || '');
  }
  setIntl(locale);
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? React.useLayoutEffect
    : React.useEffect;

type PropsType = {
  locale?: string;
  children: React.ReactNode;
};
export const LocaleContainer = (props: PropsType) => {
  const [locale, setLocale] = React.useState(() => props.locale || getLocale());
  const [intl, setContainerIntl] = React.useState(() => getIntl(locale, true));

  const handleLangChange = (aLocale: string) => {
    if (moment?.locale) {
      moment.locale(localeInfo[aLocale]?.momentLocale || 'en');
    }
    setLocale(aLocale);
    setContainerIntl(getIntl(aLocale));
  };

  useIsomorphicLayoutEffect(() => {
    event.on(LANG_CHANGE_EVENT, handleLangChange);
    return () => {
      event.off(LANG_CHANGE_EVENT, handleLangChange);
    };
  }, []);

  const defaultAntdLocale = {};
  const direcition = getDirection();

  return (
    <ConfigProvider direction={direcition} locale={localeInfo[locale]?.antd || defaultAntdLocale}>
      <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>
    </ConfigProvider>
  );
};
