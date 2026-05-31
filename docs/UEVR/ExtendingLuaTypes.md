## Extending metatables
You may have seen or made modules for lua with the typical style like so 
```lua
local M = {}
function M.some_function()
  blahblahblah()
end
local function some_local_function()
  blahblahblah()
end
local x = 1
return M
```

## Overriding/monkeypatching Global Functions
You can easily do this by simply assigning a local variable to the original function and then replacing with your own code

The code below patches all the draw api functions to accept colors as UE structs, Vector4f, or U32 
```lua
local function vec_to_u32(vec)
    local r = floor(max(0, min(255, vec.x * 255 + 0.5)))
    local g = floor(max(0, min(255, vec.y * 255 + 0.5)))
    local b = floor(max(0, min(255, vec.z * 255 + 0.5)))
    local a = floor(max(0, min(255, vec.w * 255 + 0.5)))
    return (a << 24) | (b << 16) | (g << 8) | r
end

local prev_uint = 0
local vec = nil
local function u32_to_v(color)
    if prev_uint ~= nil and prev_uint == color and vec ~= nil then
        return vec
    end
    prev_uint = color
    local r = color & 0xFF
    local g = (color >> 8) & 0xFF
    local b = (color >> 16) & 0xFF
    local a = (color >> 24) & 0xFF

    col = {
        r / 255.0,
        g / 255.0,
        b / 255.0,
        a / 255.0,
    }
    vec = Vector4f.new(r, g, b, a)
    return vec
end

local function fcolor_to_v4(t)
    local v
    if type(t) == "table" and #t == 4 then
        v = Vector4f.new(table.unpack(t))
     elseif t.R then v = Vector4f.new(t.R, t.G, t.B, t.A)
    end
    return (v * (1 / 255.0))
end

local function coerce_color_type(color)
    return (type(color) == "number" and color)
        or (color.x ~= nil and vec_to_u32(color))
        or (type(color) == "table" and vec_to_u32( fcolor_to_v4(color)))
end

local old_draw = {}
for k, v in pairs(draw) do
    old_draw[k] = v
end

function draw.outline_circle( x,  y,  radius, color, num_segments)

    old_draw.outline_circle( x,  y,  radius, coerce_color_type(color), num_segments)
end
function draw.filled_circle( x,  y,  radius, color, num_segments)

    old_draw.filled_circle( x,  y,  radius, coerce_color_type(color), num_segments)
end
function draw.outline_quad( x1,  y1,  x2,  y2,  x3,  y3,  x4,  y4, color)

    old_draw.outline_quad( x1,  y1,  x2,  y2,  x3,  y3,  x4,  y4, coerce_color_type(color))
end
function draw.filled_quad( x1,  y1,  x2,  y2,  x3,  y3,  x4,  y4, color)

    old_draw.filled_quad( x1,  y1,  x2,  y2,  x3,  y3,  x4,  y4, coerce_color_type(color))
end

```

## "Polluting" Global Tables
You may have heard not to do this and AI tends to warn against it. There are reasons for that but many do not apply to UEVR with its singular shared state. If you haven't heard or thought of this concept you may be surprised by this. Even if you were aware its possibly with lua types you may not have considered it can be done with usertypes. 

```lua

Vector3 = UE5 and Vector3d or Vector3f
Vector4 = UE5 and Vector4d or Vector4f
Vector2 = UE5 and Vector2d or Vector2f

Quat = UE5 and Quaterniond or Quaternionf

function UEVR_UObject:is_actor()
    return self.K2_GetActorLocation ~= nil and self
end
function UEVR_UObject:as_actor()
    return (self:is_actor() and self) or self:get_outer()
end
function UEVR_UObject:is_component()
    -- return self:is_child_class_of(ActorComponentClass)
    return self.GetComponentTickInterval ~= nil
end

function UEVR_UObject:is_scene_component()
    -- return self:is_class_child_of(SceneComponentClass)
    return self.K2_GetComponentToWorld ~= nil
end
function UEVR_UObject:as_component()
    if self:is_component() then return self
    else return (self.RootComponent or self.CapsuleComponent)
    end
end
function UEVR_UObject:add_component(uclass, offset)
    offset = offset or Vector3.new(0,0,0)
 local t = api:add_component_by_class(
        (self:is_actor() and self) or self:get_outer(),
        type(uclass) == "string" and Cache.get((uclass:endswith("Component") and uclass or uclass.."Component")) or uclass,
        false
    )
    if not t then print(inspect({uclass, self, "failed to add component"})) end
    t.RelativeLocation = offset
    return t
end
```
I wrote an entire massive script API using this concept! It will be available one day if I dont just reimplement it all in C++

## Loading string chunks to extend tables modularly

```lua
local kismet_libs = {
Material =  "Class /Script/Engine.KismetMaterialLibrary",
Math =      "Class /Script/Engine.KismetMathLibrary",
Rendering = "Class /Script/Engine.KismetRenderingLibrary",
System = "Class /Script/Engine.KismetSystemLibrary",
String = "Class /Script/Engine.KismetStringLibrary",
}
kismet_cache = {}
Kismet = setmetatable({}, {
            __call = function(_, lib)
                kismet_cache[lib] = kismet_cache[lib] or
                    (kismet_libs[lib] and
                        (UEVR_UObjectHook.get_first_object_by_class(api:find_uobject(kismet_libs[lib]), true)
                        or api:find_uobject(kismet_libs[lib]):get_class_default_object()))
                return kismet_cache[lib]
            end,
            __index = function(_, lib)
               kismet_cache[lib] = kismet_cache[lib] or
                    (kismet_libs[lib] and
                        (UEVR_UObjectHook.get_first_object_by_class(api:find_uobject(kismet_libs[lib]), true)
                        or api:find_uobject(kismet_libs[lib]):get_class_default_object()))
                return kismet_cache[lib]
            end
        })




local kmc_chunk = [[

    local KMC = {}
    function KMC.kismet_LinearColor_Black()
            return KM:LinearColor_Black()
        end
    function KMC.kismet_LinearColor_Blue()
            return KM:LinearColor_Blue()
        end
    function KMC.kismet_LinearColor_Desaturated(InColor, InDesaturation)
            return KM:LinearColor_Desaturated(InColor, InDesaturation)
        end
    function KMC.kismet_LinearColor_Distance(C1, C2)
            return KM:LinearColor_Distance(C1, C2)
        end
    function KMC.kismet_LinearColor_GetLuminance(InColor)
            return KM:LinearColor_GetLuminance(InColor)
            end
    function KMC.kismet_LinearColor_GetMax(InColor)
            return KM:LinearColor_GetMax(InColor)
        end
    function KMC.kismet_LinearColor_GetMin(InColor)
            return KM:LinearColor_GetMin(InColor)
        end
    function KMC.kismet_LinearColor_Gray()
            return KM:LinearColor_Gray()
        end
    function KMC.kismet_LinearColor_Green()
            return KM:LinearColor_Green()
        end
    function KMC.kismet_LinearColor_IsNearEqual(A, B, tolerance)
            return KM:LinearColor_IsNearEqual(A, B, tolerance)
        end
    function KMC.kismet_LinearColor_Quantize(InColor)
            return KM:LinearColor_Quantize(InColor)
        end
    function KMC.kismet_LinearColor_QuantizeRound(InColor)
            return KM:LinearColor_QuantizeRound(InColor)
        end
    function KMC.kismet_LinearColor_Red()
            return KM:LinearColor_Red()
        end
    function KMC.kismet_LinearColor_Set(InOutColor, InColor)
          local OutColor = {}
            KM:LinearColor_Set(OutColor, InColor)
            InOutColor = OutColor.result
            return InOutColor
        end
    function KMC.kismet_LinearColor_SetFromHSV( InOutColor, H, S, V,  A)
         local OutColor = {}
            KM:LinearColor_SetFromHSV(OutColor, H, S, V,  A)
            InOutColor = OutColor.result
            return InOutColor
        end
    function KMC.kismet_LinearColor_SetFromPow22(InOutColor, InColor)
        local OutColor = {}
            KM:LinearColor_SetFromPow22(OutColor, InColor)
            InOutColor = OutColor.result
            return InOutColor
        end
    function KMC.kismet_LinearColor_SetFromSRGB(InOutColor, InSRGB)
      local OutColor = {}
        KM:LinearColor_SetFromSRGB(OutColor, InSRGB)
        InOutColor = OutColor.result

        return InOutColor
    end
    function KMC.kismet_LinearColor_SetRandomHue(InOutColor)
         local OutColor = {}
           KM:LinearColor_SetRandomHue(OutColor)
           InOutColor = OutColor.result
        return InOutColor
    end
    function KMC.kismet_LinearColor_SetRGBA(InOutColor, R, G, B, A)
            local OutColor = {}
            KM:LinearColor_SetRGBA(OutColor, R, G, B, A)
            InOutColor = OutColor.result
            return InOutColor
        end
    function KMC.kismet_LinearColor_SetTemperature(InOutColor, InTemperature)
      local OutColor = {}
             KM:LinearColor_SetTemperature(OutColor, InTemperature)
           InOutColor = OutColor.result
            return InOutColor
        end
    function KMC.kismet_LinearColor_ToNewOpacity(InColor, InOpacity)
            return KM:LinearColor_ToNewOpacity(InColor, InOpacity)
           end
    function KMC.kismet_LinearColor_ToRGBE(InLinearColor)
            return KM:LinearColor_ToRGBE(InLinearColor)
         end
    function KMC.kismet_LinearColor_Transparent()
            return KM:LinearColor_Transparent()
        end
    function KMC.kismet_LinearColor_White()
            return KM:LinearColor_White()
        end
    function KMC.kismet_LinearColor_Yellow()
            return KM:LinearColor_Yellow()
        end
    function KMC.kismet_LinearColorLerp(A, B, Alpha)
            return KM:LinearColorLerp(A, B, Alpha)
        end
    function KMC.kismet_LinearColorLerpUsingHSV(A, B, Alpha)
        return KM:LinearColorLerpUsingHSV( A, B, Alpha)
    end
    return KMC
-- ]]

-- Pass a custom environment to the chunk
-- If you do this then you must define EVERYTHING that gets accessed, even print
local function get_kmc_chunk(env)
    local Kismet =  uevr.api:find_uobject("Class /Script/Engine.KismetMathLibrary"):get_class_default_object()
    local custom_env = {
       UEVR_UObject = _G.UEVR_UObject,
       uevr = uevr,
       KM = Kismet,
       print = print
    }
    local chunk, error = load(kmc_chunk, "KMChunk", "t", custom_env)
    if error then print(error)
    else return chunk() end
end

local function test_chunk_load()
    local KMC = get_kmc_chunk()
    if KMC then
        local res = KMC.kismet_LinearColor_Red()
        print(res.R)
        local res2 = KMC.kismet_LinearColor_SetRGBA(res, 0.5, 1.0, 0.2, 1.0)
        print(inspect(res2))
    end
end

local function test_chunk_load2()
    local KM = Kismet("Math")
    _ENV.KM = KM
     local chunk, error = load(kmc_chunk)
    local KMC = chunk()
    if KMC then
        local res = KMC.kismet_LinearColor_Red()
        print(res.R)
        local res2 = KMC.kismet_LinearColor_SetRGBA(res, 0.5, 1.0, 0.2, 1.0)
        print(res2.R)
        print(res2.G)
        print(res2.B)
        print(res.A)
    end
end
print("testing custom environment version")
test_chunk_load()

print("testing global environment version")
test_chunk_load2()

```
More generic test
```


-- The original table
local data = { a = 10, b = 20, ext = {} }

-- The metatable
local mt = {}
    -- __index handles reading missing keys
    mt.__index = function(table, key)
        for _, ex in ipairs(table.ext) do
            if type(ex) == "table" then
                if ex[key] then 
                    return ex[key]
                end
            end
        end
        return 0
        -- Return 0 for any missing key
    end
    -- -- __tostring customizes how the table is printed
    mt.__tostring = function(table)
        return "Data: a=" .. table.a .. ", b=" .. table.b
    end


-- Attach the metatable to the table
setmetatable(data, mt)
data.__mt = mt

local subdata =  class("subdata", data)
print(subdata)
-- function data.__mt.__len(table)
--      local i = 1
--      for k,v in pairs(table) do
--          i = i + 1
--      end
--      return i
--  end

-- print(data.a)     -- Output: 10
-- print(data.c)     -- Output: 0 (uses __index)
-- print(data)       -- Output: Data: a=10, b=20 (uses __tostring)
-- print(#data)
 local newfunc_chunk = [[
 return {
     d = 15,
     e = function(b)
         return 1+b
     end
 }
 ]]
 
 local newfunc_chunk2 = [[
    __mt.__len =  function(table)
          local i = 1
          for k,v in pairs(table) do
              i = i + 1
          end
          return i
      end
     return __mt
]]

-- adding new keys to a table via chunk
 local function test_chunk_load()
-- no custom env set therefore it will use current scripts env
  local chunk, error = load(newfunc_chunk)
  data.ext[#data.ext+1] = chunk()
  print(data.d)
  print(data)
  -- this has to be returned 
  -- and the outer scope object has to be set to this function
  -- or else the changes will
  -- only be present within the same function
  return data
 end
data = test_chunk_load()
print(data.d)
 -- Patching metatable by passing custom env with current metatable
 local function test_chunk_load2()
     -- literally anything you want available has to be passed
     -- even things like print
      local custom_env = {
          __mt = mt,
          pairs = pairs
          }
    local chunk, error = load(newfunc_chunk2, "Chunk", "t", custom_env)
    -- this does not need to return to affect the outer object
   setmetatable(data, chunk())
    print(#data)
end

test_chunk_load2()
print(#data)
```


## String Extensions
```lua
function string:startswith(prefix, ins)
	return self:sub(1, #prefix):equals(prefix, ins)
	-- return (ins and self:lower() or self):sub(1, #prefix) == (ins and prefix:lower() or prefix)
end

function string:endswith(suffix, ins)
	return self:sub(- #suffix):equals(suffix, ins)
	-- return (ins and self:lower() or self):sub(-#suffix) == (ins and suffix:lower() or suffix)
end


function string:to_table()
    local t = {}
    for char in self:gmatch(".") do
        t[#t + 1] = char
    end
    return t
end

-- ins = case insensitive
-- Main purpose is to allow optional case insensitive handling with a single call
-- if type_check is not true then we autoconvert to string as well (caller must be a string)
function string:equals(str, ins)
	str = (type(str) == "string" and str) or (str.to_string and str:to_string()) or tostring(str)
	return (ins and self:lower() == str:lower()) or self == str
end


-- if you prefer function syntax over .. style concatenation
-- note that we can't modify strings in place without using a proxy table
-- that feature is desirable but not worth the effort
function string:append(str)
	str = (type(str) == "string" and str) or (str.to_string and str:to_string()) or tostring(str)
	return self..str
end


-- remove trailing/leading whitespace
function string:trim()
	return self:match("^%s*(.-)%s*$")
end



function string:patternescape()
  return self:gsub("[%(%)%.%%%+%-%*%?%[%]%^%$]", "%%%1")
end

-- remove all whitespace
function string:strip()
	local s = self:gsub("%s+", "")
	return s
end

function string:letters()
	local s = self:gsub("%A", "")
	return s
end

function string:digits()
	local s = self:gsub("%D", "")
	return s
end

string.numbers = string.digits

function string:chars()
	local s = self:gsub("%W", "")
	return s
end

-- removes _2147... (the uobjectarray index) from spawned objects
function string:trim_uobject()
    local result = self:gsub("_%d+$", "")
    return result
end

-- ins = case insensitive
function string:contains(subword, ins, start)
	return ((ins and self:lower() or self):find((ins and subword:lower() or subword), start or 1, true) ~= nil)
end

-- not perfect by any means, but can handle UObject:get_address and the copy address GUI function in UEVR
function string:to_address()
	if self:match("^%w+$") ~= nil then
		if self:sub(1, 2) == "0x" then
			return tonumber(self:sub(3, #self), 16)
		elseif #self:letters() ~= 0 then
			return tonumber(self, 16)
		else
			return tonumber(self, 10)
		end
	end
	return nil
end

```

### Math Extensions

```lua
function math.clamp(x, min, max)
  return x < min and min or (x > max and max or x)
end

local sqrt = math.sqrt
 function math.sign(x)
  return x < 0 and -1 or 1
end
local sign = math.sign
local exp = math.exp

function math.when_gt(x, y)
    return math.max(sign(x - y), 0.0)
end

function math.when_le(x, y)
    return 1.0 - when_gt(x, y)
end

function math.when_lt(x, y)
    return max(sign(y - x), 0.0)
end

function math.any_gt(compare, ...)
    for i = 1, select("#", ...) do
        if select(i, ...) > compare then
            return true
        end
    end
    return false
end

function math.any_lt(compare, ...)
    for i = 1, select("#", ...) do
        if select(i, ...) < compare then
            return true
        end
    end
    return false
end

function math.all_gt(compare, ...)
    return not math.any_lt(compare, ...)
end

function math.all_lt(compare, ...)
    return not math.any_gt(compare, ...)
end
```
