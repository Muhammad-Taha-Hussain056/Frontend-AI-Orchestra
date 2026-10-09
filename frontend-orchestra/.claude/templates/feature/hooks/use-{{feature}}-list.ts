'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { {{entity}}ListOptions } from '../api/keys';
import type { {{Entity}}Filters } from '../api/keys';

export function use{{Feature}}List(filters: {{Entity}}Filters) {
  return useQuery({ ...{{entity}}ListOptions(filters), placeholderData: keepPreviousData });
}
