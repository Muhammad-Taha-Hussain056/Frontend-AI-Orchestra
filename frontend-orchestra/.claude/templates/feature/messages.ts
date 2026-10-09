// All user-facing copy for this feature. With i18n enabled, /enable-i18n converts this file into messages/*.json.
export const messages = {
  title: '{{Feature}}',
  empty: { title: 'No {{feature}} yet', action: 'Create {{entity}}' },
  noResults: 'No results for these filters',
  createFailed: 'Could not create {{entity}}. Please try again.',
  form: { submit: 'Create', quantityMin: 'Must be at least 1' },
} as const;
