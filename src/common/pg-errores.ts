import { QueryFailedError } from 'typeorm';

type ErrorPg = QueryFailedError & { driverError?: { code?: string } };

export function esViolacionUnique(e: unknown): boolean {
  return e instanceof QueryFailedError && (e as ErrorPg).driverError?.code === '23505';
}

export function esViolacionFk(e: unknown): boolean {
  return e instanceof QueryFailedError && (e as ErrorPg).driverError?.code === '23503';
}
