import { createContext, useContext } from 'react';

// App-wide actions: navigate between pages and open the trade editor from anywhere.
export const AppContext = createContext({ navigate: () => {}, openTradeForm: () => {} });
export const useApp = () => useContext(AppContext);
