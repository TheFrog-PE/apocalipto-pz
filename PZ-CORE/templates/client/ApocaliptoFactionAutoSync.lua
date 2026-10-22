-- [APOCALIPTO PZ] Sincronización Automática de Facción y Visibilidad en Mapa / Minimapa
local factionColors = {
    DOE = { r = 0.20, g = 0.50, b = 1.00 }, -- Azul táctico
    MOK = { r = 0.95, g = 0.20, b = 0.20 }, -- Rojo carmesí
    KTO = { r = 1.00, g = 0.70, b = 0.10 }, -- Ámbar / naranja
    RIV = { r = 0.10, g = 0.85, b = 0.45 }, -- Verde esmeralda
}

local function syncApocaliptoFaction(player)
    if not isClient or not isClient() then return end
    if not player then player = getPlayer() end
    if not player then return end

    local uName = player:getUsername()
    local session = _G.ApocaliptoSession

    -- Si _G.ApocaliptoSession no está en memoria, leer de apocalipto_session.ini
    if not session or not session.faction then
        pcall(function()
            local reader = getFileReader("apocalipto_session.ini", false)
            if reader then
                local params = {}
                while true do
                    local line = reader:readLine()
                    if line == nil then break end
                    line = string.trim(line)
                    if line ~= "" and string.sub(line, 1, 1) ~= "#" then
                        local sep = string.find(line, "=")
                        if sep then
                            local k = string.trim(string.sub(line, 1, sep - 1))
                            local v = string.trim(string.sub(line, sep + 1))
                            params[k] = v
                        end
                    end
                end
                reader:close()
                session = params
                _G.ApocaliptoSession = params
            end
        end)
    end

    if not session or not session.faction then return end

    local targetFaction = string.upper(session.faction)
    if targetFaction == "" then return end

    -- 1. Sincronizar membresía de la Facción en el motor nativo de PZ
    local fact = Faction.getPlayerFaction(player)
    if not fact then
        fact = Faction.getFaction(targetFaction)
        if not fact then
            pcall(function()
                if sendFactionCreate then
                    sendFactionCreate(targetFaction, uName)
                end
            end)
            pcall(function()
                fact = Faction.new(targetFaction, uName)
                if fact then
                    fact:setTag(targetFaction)
                    local col = factionColors[targetFaction]
                    if col and ColorInfo then
                        fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
                    end
                    local factions = Faction.getFactions()
                    if factions ~= nil then
                        factions:add(fact)
                    end
                end
            end)
        else
            if not fact:isOwner(uName) and not fact:isMember(uName) then
                pcall(function()
                    fact:addPlayer(uName)
                    local col = factionColors[targetFaction]
                    if col and ColorInfo then
                        fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
                    end
                end)
            end
        end
    else
        -- Ya tiene facción: asegurar que tenga tag y color
        pcall(function()
            if not fact:getTag() or fact:getTag() == "" then
                fact:setTag(fact:getName())
            end
            local col = factionColors[fact:getName()]
            if col and ColorInfo then
                fact:setTagColor(ColorInfo.new(col.r, col.g, col.b, 1))
            end
        end)
    end

    -- 2. Asegurar que las opciones de mapa y minimapa muestren a los compañeros de facción
    pcall(function()
        if ISWorldMap_instance then
            ISWorldMap_instance.showRemotePlayers = true
            ISWorldMap_instance.showPlayerNames = true
            if ISWorldMap_instance.mapAPI then
                ISWorldMap_instance.mapAPI:setBoolean("RemotePlayers", true)
                ISWorldMap_instance.mapAPI:setBoolean("PlayerNames", true)
            end
        end
    end)

    pcall(function()
        if ISMiniMap and ISMiniMap.mapAPI then
            pcall(function() ISMiniMap.mapAPI:setBoolean("RemotePlayers", true) end)
            pcall(function() ISMiniMap.mapAPI:setBoolean("PlayerNames", true) end)
            pcall(function() ISMiniMap.mapAPI:setBoolean("MiniMapSymbols", true) end)
        end
    end)
end

-- Registrar eventos en diferentes momentos del ciclo de vida para sincronización garantizada
Events.OnGameStart.Add(syncApocaliptoFaction)
Events.OnPlayerSpawn.Add(syncApocaliptoFaction)
Events.OnCreatePlayer.Add(function(id)
    local p = getSpecificPlayer(id)
    if p then syncApocaliptoFaction(p) end
end)
Events.EveryOneMinute.Add(function()
    local p = getPlayer()
    if p then syncApocaliptoFaction(p) end
end)
