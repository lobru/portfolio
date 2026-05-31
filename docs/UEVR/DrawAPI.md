# draw

A subset of [ImGui](imgui.md) accessed through a separate table `draw`. Invokable in the same conditions as `imgui` methods, i.e. within `uevr.sdk.callbacks.on_frame`, `uevr.sdk.callbacks.on_draw_ui` and within [Script Panels](../lua.md). Draw calls are added to current window's background draw list but do not modify the ImGui cursor position nor interact with any logical components of ImGui.

Note that as with ImGui, draw API is compatible with VR but is not well suited for in-game overlays, especially when projecting 3D world positions to the 2D screen. ImGui and draw API calls are projected in VR on the same plane as the UEVR UI and can be adjusted accordingly, but all scaling from the desktop screen is handled by UEVR.

# Code Examples

## Object trail 

Although VR isn't really supported for imgui in UEVR I actually made this with the intent of tracking motion controller gestures
```lua
function Vector3f:world_to_screen()
    local out = {}
    pc = pc or api:get_player_controller(0)
    Statics:ProjectWorldToScreen(pc, self, out, true)
    return Vector2f.new(out.result.X, out.result.Y)
end


local function draw_motion_path(object, path, maxpt, color, alt_method)
      local screen_location
      local last_screen_location
      local vmag = object:get_outer():GetVelocity():length()
       path = path or {}
      if #path >= maxpt or vmag == 0  then
        while #path > maxpt do
          table.remove(path, 1)
            end
        end
      table.insert(path, object:get_outer():K2_GetActorLocation())
      imgui.begin_window("###Canvas", true, 209599)
      imgui.draw_list_path_clear()
      -- draw api version
      -- uses draw_line so no thickness
      -- has to store 1 location or calculate 2 locations 
      -- so its worse right? well yes but actually no because its more flexible
      if alt_method then
            if #path >= 2 then
            -- just hold 2 points and get one at a time very simple
              for i = 2, #path do
                local v = path[i]
                last_screen_location  = path[i-1]:world_to_screen()
                if last_screen_location.x + last_screen_location.y ~= 0 then
                    screen_location = v:world_to_screen()
                    if screen_location.x + screen_location.y ~= 0 then
                        local _color = color
                        -- Here's why its worthwhile
                        -- path_stroke has to color everything at once with the same color, but with this we can decrease alpha to have a fading trail
                        _color.w = math.max(1.0 - (i / #path), 0.3)
                        draw.line(last_screen_location.x, last_screen_location.y, screen_location.x, screen_location.y, VecToU32(_color))
                        end
                    end
                end
            end
        else
            for i,v in ipairs(path) do
                screen_location = v:world_to_screen()
                if screen_location.x + screen_location.y == 0 then
                    imgui.draw_list_path_clear()
                else
                    imgui.draw_list_path_line_to(screen_location)
                end
            end
            imgui.draw_list_path_stroke(color, false, 12)
        end
        if screen_location and vmag ~= 0 then
          imgui.set_cursor_screen_pos(screen_location - Vector2f.new(0, 200))
          imgui.text("velocity magnitude: "..tostring(vmag))
      end
    imgui.end_window()
end

local points = {}
local capsule = api:get_local_pawn(0).CapsuleComponent or api:get_local_pawn(0).RootComponent
uevr.sdk.callbacks.on_frame(function()
    if capsule then
        draw_motion_path(capsule, points, 500, 0xB1A3D9D8)
    end
end)
```

Complete example of using draw API with UEVR_UObjectHook to project a circle on screen space for every skeletal mesh
```lua
  -- draw api takes U32 hex integers for colors 
  local function VecToU32(vec)
      local r = math.floor(math.max(0, math.min(255, vec.x * 255 + 0.5)))
      local g = math.floor(math.max(0, math.min(255, vec.y * 255 + 0.5)))
      local b = math.floor(math.max(0, math.min(255, vec.z * 255 + 0.5)))
      local a = math.floor(math.max(0, math.min(255, vec.w * 255 + 0.5)))
      -- ImGui expects 0xAABBGGRR
      return (a << 24) | (b << 16) | (g << 8) | r
  end


  pc = api:get_player_controller(0)
  local fill_color = 0xB1A3D9D8
  -- some constants
  local UE_WORLD_MAX = 2097152.0
  local MIN_DISTANCE = 850.0
  local RADIUS_SCALE = 0.6
  local MAX_DISTANCE = 6000

  local function scale_by_distance(world_location, distance, min_radius, max_radius)
    if distance > MAX_DISTANCE then MAX_DISTANCE = distance * 1.1 end
    local d = math.min(math.max(distance, MIN_DISTANCE), MAX_DISTANCE)
    -- log scaling for more of a curve
    local t = (math.log(d) - math.log(MIN_DISTANCE)) / (math.log(MAX_DISTANCE) - math.log(MIN_DISTANCE))
    t = math.min(math.max(t, 0.0), 1.0)
    -- lerp specified radius scale by log scaled distance
    local radius = max_radius + (min_radius - max_radius) * t
  return radius
end

local function get_screen_position(world_location)
  local screen_location = {}
  GameplayStatics:ProjectWorldToScreen(pc, world_location, screen_location, true)
  return Vector2f.new(screen_location.result.X, screen_location.result.Y)
end


local resolution = imgui.get_display_size()

local function object_draw_call(object)
  if UEVR_UObjectHook.exists(object) then
    -- get location from the actor
    local world_location = object.K2_GetComponentLocation and object:K2_GetComponentLocation() or object:get_outer():K2_GetActorLocation()
    -- raise the height a bit since it will give us the location of the root bone which is between their feet
    world_location.z = world_location.z + 50
    -- project the world location to screen
    local screen_position = get_screen_position(world_location)
    if not screen_position then return end
    -- check that the object is actually on screen (could limit to portion of the screen easily)
    -- if you're doing anything more complex, e.g. checking for mouse over you should have a function to check if the point is in a rectangle
    if screen_position and screen_position.x and (screen_position.x < resolution.x and screen_position.x > 0) and
     screen_position.y and (screen_position.y < resolution.y and screen_position.y > 0) then

      -- scale the size of the output circle using glm Vec3 bindings
      -- GetFocalLocation gives the location of the camera itself, not the pawn or player controller
      local distance = (world_location - pc:GetFocalLocation()):length()
      local radius = scale_by_distance(world_location, distance, 4.0, 48.0) * RADIUS_SCALE

      -- use the radius scaling to simplify the circle and reduce draw call complexity, math.floor to get an integer
      local segments = math.floor(radius * 0.25)
      draw.filled_circle(screen_position.x, screen_position.y, radius, fill_color, segments)
      -- add a slight outline
      draw.outline_circle(screen_position.x, screen_position.y, radius * 1.01, VecToU32(Vector4f.new(1.0, 1.0, 1.0, 1.0)), segments)
      -- add text to the draw list
      draw.text("Distance: "..tostring(math.floor(distance)), screen_position.x, math.max(0,screen_position.y - radius * 2), fill_color)
      draw.text("Radius: "..tostring(math.floor(radius)), screen_position.x, math.max(0, screen_position.y - radius), fill_color)
      end
  end
end
  
  
  local mesh_comps
  local skinnedmesh = api:find_uobject("Class /Script/Engine.SkinnedMeshComponent")
  
  
  uevr.sdk.callbacks.on_frame(function()
      mesh_comps = mesh_comps or skinnedmesh:get_objects_matching(false)
      resolution = resolution or imgui.get_display_size()
      -- make a full sized window with flags to hide the background, prevent focus, and ignore inputs
      imgui.set_next_window_size(resolution)
      imgui.set_next_window_pos(Vector2f.new(0, 0))
      imgui.begin_window("###Canvas", true, 209599)
      if mesh_comps then
          for i, object in ipairs(mesh_comps) do
              object_draw_call(object)
          end
      end
      imgui.end_window()
  end)

```
# Methods

## draw.text(text, x, y, color)
## draw.filled_rect(x, y, w, h, color)
## draw.outline_rect(x, y, w, h, color)
## draw.line(x1, y1, x2, y2, color)
No way to set thickness, better to use a rect or use path_line_to
## draw.outline_circle(x, y, radius, color, num_segments)
## draw.filled_circle(x, y, radius, color, num_segments)
## draw.outline_quad(x1, y1, x2, y2, x3, y3, x4, y4, color)
## draw.filled_quad(x1, y1, x2, y2, x3, y3, x4, y4, color)


# Clips

## Pong
https://github.com/user-attachments/assets/7b83ba61-fa8e-4f68-8466-c968f594c853

## Motion Trail
https://github.com/user-attachments/assets/0d488a54-b5f5-4137-92bf-628781cca376

## Bones

https://github.com/user-attachments/assets/fcde0451-89ca-4c1a-9bb5-9ef0d2b23900

## Bone selection/highlighting

https://github.com/user-attachments/assets/12410f74-0430-4fb3-96ca-a2d8142007c9



## Scene Component trackers
https://github.com/user-attachments/assets/12e30581-c183-477f-995c-1849a0b1d8d6



## Joystick
https://github.com/user-attachments/assets/6a27168e-c0da-422d-a088-605807a3d0f2

## Crosshair
https://github.com/user-attachments/assets/cd3aa854-fa8d-412b-9038-8ccd0c401d7b


## Knob

https://github.com/user-attachments/assets/c485a6e1-478a-4e17-ac35-88d150344cf2


