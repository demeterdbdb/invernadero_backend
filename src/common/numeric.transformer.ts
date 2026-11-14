import { ValueTransformer } from 'typeorm';

// Postgres devuelve NUMERIC como string; lo convertimos a number.
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null | undefined) =>
    value === null || value === undefined ? value : Number(value),
};
