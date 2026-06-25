import { useSyncExternalStore } from 'react';
import type { SearchController, SearchState } from '@/lib/search/controller';

/** Subscribe a component to the controller's state. */
export function useSearchState(controller: SearchController): SearchState {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot);
}
