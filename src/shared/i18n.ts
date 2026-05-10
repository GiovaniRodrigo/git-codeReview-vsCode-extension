import { en } from './locales/en';
import { ptBr } from './locales/pt-br';

export type Translations = typeof en;

export function getTranslations(language: string): Translations {
  const lang = language.toLowerCase();
  if (lang.startsWith('pt')) {
    return ptBr;
  }
  return en;
}
