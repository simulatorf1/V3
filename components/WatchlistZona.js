'use client';

import { WatchlistProvider } from './WatchlistContext';

export default function WatchlistZona({ children }) {
  return <WatchlistProvider>{children}</WatchlistProvider>;
}
