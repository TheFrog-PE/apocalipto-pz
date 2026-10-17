--[[
    =======================================================================
    APOCALIPTO PZ - SERVER FACTION REGISTRY (BUILD 42)
    Garantiza que las 4 facciones existan en el servidor dedicado
    y maneja la inscripción automática de jugadores.
    =======================================================================
--]]

if isClient() then return end

local FACTION_CONFIGS = {
    { name = "DOE", tag = "DOE", owner = "The Frog", r = 0.2, g = 0.5, b = 0.9 },
    { name = "MOK", tag = "MOK", owner = "The Frog", r = 0.85, g = 0.35, b = 0.1 },
    { name = "KTO", tag = "KTO", owner = "The Frog", r = 0.65, g = 0.25, b = 0.8 },
    { name = "RIV", tag = "RIV", owner = "The Frog", r = 0.25, g = 0.75, b = 0.35 },
}

local function initApocaliptoServerFactions()
    print("[APOCALIPTO SERVER] Verificando facciones predefinidas (DOE, MOK, KTO, RIV)...")
    for _, cfg in ipairs(FACTION_CONFIGS) do
        if not Faction.factionExist(cfg.name) then
            pcall(function()
                local fact = Faction.new(cfg.name, cfg.owner)
                if fact then
                    fact:setTag(cfg.tag)
                    local col = ColorInfo.new(cfg.r, cfg.g, cfg.b, 1.0)
                    fact:setTagColor(col)
                    Faction.getFactions():add(fact)
                    print("[APOCALIPTO SERVER] Facción " .. cfg.name .. " creada exitosamente.")
                end
            end)
        else
            print("[APOCALIPTO SERVER] Facción " .. cfg.name .. " ya existente en el mundo.")
        end
    end
end

local function onApocaliptoClientCommand(module, command, player, args)
    if module == "apocalipto" and command == "joinFaction" then
        local fName = args.faction
        local uName = args.username or (player and player:getUsername())
        if not fName or not uName then return end

        print("[APOCALIPTO SERVER] Comando joinFaction recibido para " .. tostring(uName) .. " en " .. tostring(fName))
        local fact = Faction.getFaction(fName)
        if not fact then
            pcall(function()
                fact = Faction.new(fName, uName)
                if fact then
                    fact:setTag(fName)
                    Faction.getFactions():add(fact)
                end
            end)
        end

        if fact then
            local currentOwner = fact:getOwner()
            if not currentOwner or currentOwner == "" or currentOwner == "The Frog" or currentOwner == "Admin" then
                pcall(function() fact:setOwner(uName) end)
                print("[APOCALIPTO SERVER] " .. tostring(uName) .. " establecido como líder de " .. tostring(fName))
            else
                if not fact:isMember(uName) and not fact:isOwner(uName) then
                    pcall(function() fact:addPlayer(uName) end)
                    print("[APOCALIPTO SERVER] " .. tostring(uName) .. " agregado como miembro de " .. tostring(fName))
                end
            end

            pcall(function()
                if player then
                    sendServerCommand(player, "apocalipto", "factionConfirmed", { faction = fName, owner = fact:getOwner() })
                end
            end)
        end
    end
end

Events.OnInitGlobalModData.Add(initApocaliptoServerFactions)
Events.OnClientCommand.Add(onApocaliptoClientCommand)
