// AdminAreasAPI.js
// Arquivo de compatibilidade que exporta adminAPI como adminAreasAPI

import { adminAPI } from './api';

// Exportar adminAPI com o nome esperado pelos componentes
export const adminAreasAPI = adminAPI;

// Exportação padrão
export default adminAreasAPI;
