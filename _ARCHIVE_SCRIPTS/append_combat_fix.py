import os

fix_code = """

-- === APOCALIPTO COMBAT HIT FIX (PREVENTS ZOMBIE FREEZE ON HIT) ===
local HIT_FALLBACKS = {"HeadLeft", "HeadRight", "HeadTop", "Uppercut"}

local function fixZombieReaction(target)
    if not target or not instanceof(target, "IsoZombie") then return end
    pcall(function()
        local currentReact = target:getHitReaction()
        if not currentReact or currentReact == "" then
            local idx = (ZombRand and ZombRand(#HIT_FALLBACKS) + 1) or 1
            target:setHitReaction(HIT_FALLBACKS[idx] or "HeadLeft")
        end
    end)
end

if Events.OnWeaponHitCharacter then
    Events.OnWeaponHitCharacter.Add(function(wielder, character, handWeapon, damage)
        fixZombieReaction(character)
    end)
end

if Events.OnHitZombie then
    Events.OnHitZombie.Add(function(zombie, attacker, bodyPart, weapon)
        fixZombieReaction(zombie)
    end)
end
"""

target_file = r"C:\Program Files (x86)\Steam\steamapps\common\ProjectZomboid\media\lua\client\ApocaliptoFactionManager.lua"

with open(target_file, "r", encoding="utf-8") as f:
    current = f.read()

if "APOCALIPTO COMBAT HIT FIX" not in current:
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(fix_code)
    print("Combat fix appended successfully!")
else:
    print("Combat fix already present!")
