import { browser } from '$app/environment'
import { init, register } from 'svelte-i18n'

const defaultLocale = 'en'

register('ja', () => import('./locales/ja.json'));
register('en', () => import('./locales/en.json'));
register('pt', () => import('./locales/pt.json'));
register('pt-BR', () => import('./locales/pt.json'));
register('ko', () => import('./locales/ko-kr.json'));
register('fa', () => import('./locales/fa.json'));
register('ar', () => import('./locales/ar.json'));
register('zh-TW', () => import('./locales/zh-TW.json'));

register('ja', () => import('./locales/languageMap/ja.json'));
register('en', () => import('./locales/languageMap/en.json'));
register('ko', () => import('./locales/languageMap/ko-kr.json'));
register('zh-TW', () => import('./locales/languageMap/zh-TW.json'));

register('ja', () => import('./locales/labeling/ja.json'));
register('en', () => import('./locales/labeling/en.json'));
register('zh-TW', () => import('./locales/labeling/zh-TW.json'));

init({
    fallbackLocale: defaultLocale,
    initialLocale: browser ? window.navigator.language : defaultLocale,
})
