// Client-safe public API. Routes import ONLY from here (and from ./server for prefetch). Never add 'use client' here.
export { {{Feature}}Table } from './components/{{feature}}-table';
export { Create{{Entity}}Form } from './components/create-{{entity}}-form';
export { {{entity}}Keys } from './api/keys';
export type { {{Entity}}Filters } from './api/keys';
