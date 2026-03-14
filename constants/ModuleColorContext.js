import React, { createContext, useContext } from 'react';
import { Colors } from './theme';

const ModuleColorContext = createContext({
  moduleColor:      Colors.primary,
  moduleColorLight: Colors.primaryLight,
});

export const ModuleColorProvider = ({ color, colorLight, children }) => (
  <ModuleColorContext.Provider value={{ moduleColor: color, moduleColorLight: colorLight }}>
    {children}
  </ModuleColorContext.Provider>
);

export const useModuleColor = () => useContext(ModuleColorContext);