### UEVR Lua Library 
This is unlikely to be released as a polished mod. UEVR script writers should study as much of the Dev folder as possible with the understanding that dependency management has been excluded. If you are going to give any training data to an AI, give it this library.

Below are direct links to notable written guides. You should also view the changes in my forked uevr-docs repo
https://github.com/lobotomy-x/uevr-docs/blob/main/src/plugins/lua

### Dynamic UFUNCTION Out Param Handling 
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/Automatic%20Out%20Parameters.md

### Spawn Dev Console in Shipping Build

```lua
local pc 
local console_spawned = false
local function spawn_console()
    pc = pc or api:get_player_controller(0)
    if pc then
        local pc_player_ref = pc.Player
            if not pc_player_ref then
                local props = pc:get_class():get_child_properties()
                while props ~= nil do
                    -- probably only necessary because MHUR devs want to be different and named their player ref PLAYER
                    if props and props.get_fname and props:get_fname():to_string():lower() == "player" then
                        pc_player_ref = pc[props:get_fname():to_string()]
                        if pc_player_ref ~= nil then break end
                    end
                end
            end
            local _viewport
            if pc_player_ref then
                _viewport = pc_player_ref.ViewportClient
            else
                _viewport = uevr.api:find_uobject("Class /Script/Engine.GameViewportClient"):get_first_object_matching(false)
            end

            if _viewport and _viewport.ViewportConsole == nil then
                   local console_class = uevr.api:find_uobject("Class /Script/Engine.Console")

             local temp = uevr.api:spawn_object(console_class, _viewport)
               _viewport.ViewportConsole = temp
               if _viewport.ViewportConsole ~= nil then
                    console_spawned = true
                    print("Console spawned, activate with ~")
               end
            end
        end
end
spawn_console()


```

### Lua For Normal Programmers
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/Lua%20For%20Normal%20Programmers.md

### Optimizing Lua Tables
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/LuaTablesBreakdown.md

### Lua Metatables and Usertype Extensions
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/ExtendingLuaTypes.md

### Pure Lua Extensions for GLM Math Types
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/Extending%20GLM.md

### Styling UEVR Main GUI
https://github.com/lobotomy-x/Unreal-Lua-Library/blob/main/Docs/UEVR/Styling%20the%20UEVR%20Main%20GUI%20from%20Lua.md
