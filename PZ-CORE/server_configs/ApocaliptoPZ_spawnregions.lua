-- =========================================================================
-- APOCALIPTO PZ // PUNTOS DE REAPARICIÓN TERRITORIALES (BUILD 42)
-- Cuatro facciones estrictamente segregadas geográficamente en Knox County
-- =========================================================================

function SpawnRegions()
    return {
        -- FACCIÓN 1: DEPT. OF EMERGENCY (D.O.E.)
        -- Territorio: Complejo Militar y Residencial Fortificado en March Ridge
        {
            name = "D.O.E. [March Ridge - Base Militar]",
            file = "media/maps/March Ridge, KY/spawnpoints.lua"
        },

        -- FACCIÓN 2: MULDRAUGH OUTCASTS (M.O.K.)
        -- Territorio: Zona de Almacenes Industriales y Carretera Sur de Muldraugh
        {
            name = "M.O.K. [Muldraugh - Sector Industrial]",
            file = "media/maps/Muldraugh, KY/spawnpoints.lua"
        },

        -- FACCIÓN 3: KNOX TOXIC ORDER (K.T.O.)
        -- Territorio: Campamentos Forestales y Lago Aislado en Fallas Lake
        {
            name = "K.T.O. [Fallas Lake - Enclave Rural]",
            file = "media/maps/Fallas Lake, KY/spawnpoints.lua"
        },

        -- FACCIÓN 4: RIVERSIDE CIVILS (R.I.V.)
        -- Territorio: Sector Urbano Residencial y Muelles del Río Ohio en Riverside
        {
            name = "R.I.V. [Riverside - Distrito Residencial]",
            file = "media/maps/Riverside, KY/spawnpoints.lua"
        }
    }
end
