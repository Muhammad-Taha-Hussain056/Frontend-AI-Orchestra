export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'scope-empty': [2, 'never'],
    // keep in sync with workspace names (apps/*, packages/*) plus deps/ci/release
    'scope-enum': [2, 'always', ['web', 'admin', 'ui', 'contracts', 'utils', 'config', 'deps', 'ci', 'release']],
  },
};
