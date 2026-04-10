import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

export function render(url: string) {
  const pathname = new URL(url, 'https://ausvisaservice.com').pathname;
  const appHtml = renderToString(
    <React.StrictMode>
      <App pathname={pathname} />
    </React.StrictMode>
  );

  return { appHtml };
}
