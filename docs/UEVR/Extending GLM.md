```lua

Vector3 = UE5 and Vector3d or Vector3f
Vector4 = UE5 and Vector4d or Vector4f
Vector2 = UE5 and Vector2d or Vector2f
local fquat = UE5 and Quaterniond or Quaternionf
-- in theory makes it ignore case. Patched in the backend anyway but still cool
Quat = setmetatable({}, {__index = function(table, k)
                                return fquat[k:lower()]
                            end})

function Vector4d:components()
    return self.x, self.y, self.z, self.w
end


function Vector3:components()
    return self.x, self.y, self.z
end

function Vector4f:components()
    return self.x, self.y, self.z, self.w
end

function Quat:components()
    return self.x, self.y, self.z, self.w
end

function Vector2f:components()
    return self.x, self.y
end



local function pow(vec, p)
    local x, y, z = vec.x, vec.y, vec.z
    return Vector3f.new(x^p, y^p, z^p)
end

-- split table into keys and values so you can iterate key names as an array
function take_values(_table)
	if is_array(_table) then return _table end
	local values = {}
	for k, v in orderedPairs(_table) do
		table.insert(values, v)
			end
	return values
end

local function _unpack(t)
    return table.unpack(take_values(t))
end


local vector_alias = {
    false, Vector2f, Vector3, Vector4f
}
local component_idx = {"x", "y", "z", "w"}

function vector(...)
    return vector_alias[select('#', ...)].new(...)
end

---- local v = vector(1, 2) == Vector2f.new(1, 2)

local function _mul(a, b)
    return a*b
end

local function _div(a, b)
    return a / b
end

local function _add(a, b)
    return a + b
end

local function _sub(a, b)
    return a - b
end

local function component_expression(func, a, b)
    local c = min(select('#', a:components()), select('#', b:components()))
    return vector(func(a.x, b.x), func(a.y, b.y), c > 2 and func(a.z, b.z) or nil, c > 3 and func(a.w, b.w) or nil)
end

-- patched in the backend
local function vector_div(vec, s)
    if type(s) == "number" then
        return vec * (1 / s)
    elseif s and s.x then
        return component_expression(_div, vec, s)
    end
end

function Vector3f.__div(a, b)
    return vector_div(a, b)
end

function Vector3d.__div(a, b)
    return vector_div(a, b)
end

function Vector2f.__div(a, b)
    return vector_div(a, b)
end

function Vector4f.__div(a, b)
    return vector_div(a, b)
end

-- print("div test")

-- local v = Vector3.new(2, 2, 2) / Vector3.new(1, 1, 1)
-- print(v.x)


local function vector_mult_structs(a, b)
    local t = {X = a.X * b.X, Y = a.Y * b.Y}
    if a.Z then t.Z = a.Z * b.Z
    end
    if a.W then t.W = a.W * b.W
    end
    return t
end


local function _size(v)
    for i = 1, 4 do
        if v[component_idx[i]] == nil then
            return i - 1
        end
    end
end


-- this is really satisfying butnot very useful once my lua api update gets merged
local struct_comps = {
        {"X"},
        {"X", "Y"},
        {"X", "Y", "Z"},
        {"X", "Y", "Z", "W"},
    }
local function table_from_variadic(...)
    local t = {}
    for i,v in ipairs(struct_comps[select("#", ...)]) do
        t[v] = select(i, ...)
    end
    return t
end

-- Shorthand vector creation from a table
-- You can use table constructor syntax and omit the parentheses
-- this is less optimized than just using a vector but its still interesting

-- e.g. v2f{0,0}
function v3f(t)
    return Vector3f.new(_unpack(t))
end



function Vector3:distance(other)
    return (self - other):length()
end


function Vector3:calc_lookat(other)
    local v =  other - self
    local distance = v:length()
    return v:normalized(), distance
end



function Vector3:extrapolate(other, distance)
    return other +  (other - self) * distance
end

function Vector2:extrapolate(other, distance)
    return other +  (other - self) * distance
end

function Vector2:distance(other)
    return (self - other):length()
end


-- vp = point on plane, vn = plane normal
function Vector3:project_intersection_onto_plane(vp, vn)
    local dir = self - vp
     vn:normalize()
    local vdot = dir:dot(vn)
    local vproj = vn * vdot
    return self - vproj
end

local function normalize(...)
    for i = 1, select("#", ...) do
        local v = select(i, ...)
        v:normalize()
    end
end
local function quat_vector(q)
    return vector(q.X, q.Y, q.Z)
end

function Vector3:rotate(quat)
    local q_vec = vector(quat.X, quat.Y, quat.Z)
    local temp = q_vec:cross(self) + (self * quat.W)
    local result = self + (q_vec:cross(temp) * 2)
    return result * rad2deg
end


