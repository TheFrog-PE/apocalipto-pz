--[[
    =======================================================================
    APOCALIPTO PZ - FACTION MANAGER & AUTO-ENROLLMENT (BUILD 42)
    Garantiza que la facción elegida en el Launcher ya exista y el jugador
    esté incorporado a ella sin ventanas emergentes de "Crear facción".
    =======================================================================
--]]

local ApocaliptoFactionManager = {}
ApocaliptoFactionManager.synced = false

local FACTION_COLORS = {
    DOE = ColorInfo.new(0.2, 0.5, 0.9, 1.0),
    MOK = ColorInfo.new(0.85, 0.35, 0.1, 1.0),
    KTO = ColorInfo.new(0.65, 0.25, 0.8, 1.0),
    RIV = ColorInfo.new(0.25, 0.75, 0.35, 1.0),
}

local FACTION_SPAWNS = {
    DOE = { x = 9883, y = 12812, z = 0 }, -- March Ridge Base Militar
    MOK = { x = 10770, y = 10271, z = 0 }, -- Muldraugh Sur
    KTO = { x = 7213, y = 8288, z = 0 },  -- Fallas Lake
    RIV = { x = 5739, y = 5258, z = 0 },  -- Riverside
}

local function getSessionFaction()
    local targetFaction = (ApocaliptoSession and ApocaliptoSession.faction) or nil
    if not targetFaction then
        local sReader = getFileReader("apocalipto_session.ini", false)
        if sReader then
            while true do
                local sLine = sReader:readLine()
                if sLine == nil then break end
                sLine = string.trim(sLine)
                local sSep = string.find(sLine, "=")
                if sSep then
                    local sk = string.trim(string.sub(sLine, 1, sSep - 1))
                    local sv = string.trim(string.sub(sLine, sSep + 1))
                    if sk == "faction" then
                        targetFaction = sv
                        break
                    end
                end
            end
            sReader:close()
        end
    end
    if not targetFaction or targetFaction == "" then
        targetFaction = "MOK"
    end
    return string.upper(targetFaction)
end

local function getSessionUser()
    local uName = (ApocaliptoSession and ApocaliptoSession.user) or nil
    if not uName then
        local sReader = getFileReader("apocalipto_session.ini", false)
        if sReader then
            while true do
                local sLine = sReader:readLine()
                if sLine == nil then break end
                sLine = string.trim(sLine)
                local sSep = string.find(sLine, "=")
                if sSep then
                    local sk = string.trim(string.sub(sLine, 1, sSep - 1))
                    local sv = string.trim(string.sub(sLine, sSep + 1))
                    if sk == "user" then
                        uName = sv
                        break
                    end
                end
            end
            sReader:close()
        end
    end
    return uName
end

function ApocaliptoFactionManager.ensureFactionMembership(playerObj)
    local player = playerObj or getPlayer()
    if not player then return end

    local targetFaction = getSessionFaction()
    local sessionUser = getSessionUser()
    local uName = (sessionUser and sessionUser ~= "" and sessionUser ~= "Bob") and sessionUser or player:getUsername()

    print("[APOCALIPTO FACTIONS] Sincronizando membresía de: " .. tostring(uName) .. " en facción: " .. tostring(targetFaction))

    local tagCol = FACTION_COLORS[targetFaction] or ColorInfo.new(0.85, 0.35, 0.1, 1.0)
    local fact = Faction.getPlayerFaction(player) or Faction.getFaction(targetFaction)

    if not fact then
        pcall(function()
            fact = Faction.new(targetFaction, uName)
            if fact then
                fact:setTag(targetFaction)
                fact:setTagColor(tagCol)
                Faction.getFactions():add(fact)
                print("[APOCALIPTO FACTIONS] Facción " .. targetFaction .. " instanciada localmente para " .. tostring(uName))
            end
        end)
        if not fact then
            fact = Faction.getFaction(targetFaction)
        end
    end

    if fact then
        if not fact:getTag() or fact:getTag() == "" then
            pcall(function() fact:setTag(targetFaction) end)
        end
        if not fact:getTagColor() then
            pcall(function() fact:setTagColor(tagCol) end)
        end
        if not fact:isMember(uName) and not fact:isOwner(uName) then
            local currentOwner = fact:getOwner()
            if not currentOwner or currentOwner == "" or currentOwner == "The Frog" or currentOwner == "Admin" then
                pcall(function() fact:setOwner(uName) end)
                print("[APOCALIPTO FACTIONS] Asignado como líder de facción " .. targetFaction .. ": " .. tostring(uName))
            else
                pcall(function() fact:addPlayer(uName) end)
                print("[APOCALIPTO FACTIONS] Agregado como miembro de facción " .. targetFaction .. ": " .. tostring(uName))
            end
        end
    end

    -- Notificar al servidor dedicado para registrar al jugador
    pcall(function()
        sendClientCommand(player, "apocalipto", "joinFaction", { faction = targetFaction, username = uName })
    end)
    pcall(function()
        if not Faction.factionExist(targetFaction) then
            sendFactionCreate(targetFaction, uName)
        end
    end)
end

-- Confirmación desde servidor
Events.OnServerCommand.Add(function(module, command, args)
    if module == "apocalipto" and command == "factionConfirmed" then
        local fName = args.faction
        local owner = args.owner
        local player = getPlayer()
        if fName and player then
            local fact = Faction.getFaction(fName)
            if fact then
                pcall(function()
                    if owner and owner ~= "" then fact:setOwner(owner) end
                    if not fact:isMember(player:getUsername()) and not fact:isOwner(player:getUsername()) then
                        fact:addPlayer(player:getUsername())
                    end
                end)
            end
        end
    end
end)

local function ensureFactionSpawn(player)
    if not player then return end
    local hours = player:getHoursSurvived() or 0
    if hours < 0.02 then
        local targetFaction = getSessionFaction()
        local coords = FACTION_SPAWNS[targetFaction]
        if coords then
            print("[APOCALIPTO SPAWN] Superviviente nuevo de faccion " .. tostring(targetFaction) .. " localizado en coords: (" .. coords.x .. ", " .. coords.y .. ")")
            pcall(function()
                player:setX(coords.x)
                player:setY(coords.y)
                player:setZ(coords.z)
                player:setLx(coords.x)
                player:setLy(coords.y)
                player:setLz(coords.z)
            end)
        end
    end
end

-- Ejecutar en ciclo de vida del jugador
local function onPlayerUpdateHook(player)
    if ApocaliptoFactionManager.synced then return end
    if not player then return end
    local uName = player:getUsername()
    if not uName or uName == "" or uName == "Bob" then return end

    ApocaliptoFactionManager.synced = true
    ApocaliptoFactionManager.ensureFactionMembership(player)
    ensureFactionSpawn(player)
end

Events.OnPlayerUpdate.Add(onPlayerUpdateHook)

Events.OnCreatePlayer.Add(function(playerNum, player)
    ApocaliptoFactionManager.ensureFactionMembership(player)
    ensureFactionSpawn(player)
end)

Events.OnGameStart.Add(function()
    local p = getPlayer()
    ApocaliptoFactionManager.ensureFactionMembership(p)
    ensureFactionSpawn(p)
end)
