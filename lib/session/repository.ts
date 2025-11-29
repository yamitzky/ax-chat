import { createContext, useContext } from 'react';
import type { Session } from './types';

/**
 * 汎用 Repository インターフェース
 */
export interface SessionRepository<TData = unknown> {
  create(session: Session<TData>): Promise<void>;
  save(session: Session<TData>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Context for Dependency Injection
 */
export const SessionRepositoryContext = createContext<SessionRepository<any> | null>(null);

/**
 * Repository hook for Dependency Injection
 */
export function useSessionRepository<TData = unknown>(): SessionRepository<TData> {
  const repository = useContext(SessionRepositoryContext);
  if (!repository) {
    throw new Error('SessionRepositoryContext not provided');
  }
  return repository;
}
