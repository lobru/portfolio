## Quick Comparison

| C++ / HLSL / etc.                     |  Lua               |  Python            |
| :---                                  |       ---          |               ---: |
|`!=`                                   |  `~=`              |      `!=`          |
|`nullptr`                              |  `nil`             |      `None`        |
| `for (i = 0; i <= T.size() - 1; ++i)` |  `for i = 1, #T do`|   `for i in t:`    |
| Ternary Operator                      |                    |                    |
|`a = b ? c : d`                        | `a = b and c or d` | `a = c if b else d`|
| Static functions                      |                    |                    |
| `Namespace::Klass::Func()`            | `object.func()`    |`Class.func()`      | 
| Members                               |                    |                    |
| `this.Func()`                         | `self:func()`      |`self.func()`       | 
| Casting                               |                    |                    |
| `(Type)(object)`                      | Not possible       |`obj = Type(object)`|
| Whitespace                            |                    |                    |
| Doesn't matter except for macros      | Never matters      | Critical           |


### Strings
Strings are really weird in lua! Everything is a string, everything can be a string, you can write your entire program as a string and then load it as a chunk, but you can't modify a string ever. Wait but I thought we can concatetanate with `..`
Well yes but actually no. You're still not modifying anything, all you're doing is allocating a new string object and copying the data from the other two. In fact, a `string` object in lua is really just a pointer (everything in lua is tbh) to the address of a constant array of characters. You actually cannot make a string function to modify in place without some proxy string table 

### Correct Error Handling
`pcall` and `xpcall` can be used to avoid errors but not many UEVR modders seem to understand the usage fully and don't take any of the values returned by `pcall`. These contain the result and either the error message if it failed or the value returned by the inner function if it succeeded
```lua
local riskyvalue
local success, result = pcall(function()
  return riskyfunc()
end)
if not success then print(result)
else riskyvalue = result
end

```
I usually just abbreviate to `local s,r = pcall()`

### Declaring locals
Local variables should be used as much as possible. There's some oddities however. First of all you may have seen lua code that looks like this
```lua
local var
local function do_something()
    var = var or get_value()
end
do_something()
```
This is fairly simple, var gets declared with `nil` value and if its `nil` when we run the function it gets set. On subsequent runs it will already be set and nothing happens. The important part here I'm showing is the declaration. This is my recommended way of declaring named variable without default values. Do not assign local variables to `nil` that is pointless.

Please be aware this cannot be used for globals at all. The code below would throw an error
```lua
var
local function do_something()
    var = var or get_value()
end
do_something()
```
There is no way to programmatically create new locals but you can use the following code to prevent declaring real globals and make it so global declarations create variables in a limited scope, very similar to locals

```lua
local _ENV = setmetatable({}, {__index=_G,__newindex=rawset})
```

### Conditional Assignment Tricks
You can iterate down nested tables like so
```lua
  local function func(a, b, c, t)
    t = t or {}
    t[b] = t[b] or {}
    t[b][c] = t[b][c] or a
  end
```
Note that in that case you will get persistent storage even if t is nil but you won't be able to retrieve the values without a reference to the table created in the first line.


### Ternary operator

In most sane languages we can combine if else statements into a single conditional expression with the `a ? b : c` or `if a then b else c`. This is really nice especially in C languages where using it inline helps reduce verbosity. In HLSL (but not GLSL) shader programming it actually compiles to fewer instructions and is an important optimization feature. Outside of that usecase its just syntactic sugar but its a nice thing to have and something you may be missing in lua if like me you just jumped in thinking it looks enough like python to get by. As briefly shown above you can do the same thing in lua 

This is what I was doing before I found out
```lua
local id = ""
if type(text) == "string" then
  id = text:sub(1, math.min(#text, 25)) else
  id = text
 end
```
Here's the same functionality using the trick
```lua
local id = type(text) == "string" and text:sub(1, math.min(#text, 25)) or text
```
This is obviously way better since it reduces line count without harming readability and combines declaration and conditional assignment into one step. I use this technique quite often but sometimes you should just stick with `if then else end`

If you are doing anything with multiple steps please make use of parentheses and indents to improve readability and gate logic. Parentheses are never required for conditionals but they are always parsed so use them correctly

You could technically force anything to be assignable like this by using an anonymous function e.g.
```lua
a = a and b or (function() return c)() 
```
In this case you would be better off just using if then else.


### Conditional evaluation order

Lua uses short circuit evaluation so you can use increasingly specific conditionals like so
```lua
    if pc and pc.Character and pc.Character.Mesh and pc.Character.Mesh ~= active_mesh then
        active_mesh = pc.Character.Mesh
    end
```

### "Attempt to index a boolean value"

This is a very common error that can happen for a number of reasons and will vary by case. One possibility is that you tried to require a module that doesn't have a return statement and accessed something from it
It can also happen if you use implicit `nil` checks e.g. `if not a then b end`  


### multireturn/multiassignment
if you've looked at the imgui api you must know that multireturn is a thing since most imgui functions make use of it. Its pretty intuitive and worth using sometimes, although its realistically no different than returning a table. If you want to discard a returned value that isn't at the end of the list just use _


Here's an example of multiassignment
```lua
  local world, game_engine, viewport, pc, pawn, game_engine_class, level, game_instance,
  melee_weapon, melee_weapon_mesh, gun_mesh, last_weapon, using_weapon, gun, widgets,
  suit_mesh, mesh, mychar, abp, poseable_mesh,
  fp_spring_arm, fp_cam_actor, first_person_cam,
  tp_spring_arm, tp_cam_actor, tp_cam_comp,
  cinematic_camera, free_cam, game_zoom, game_spring, game_cam_comp = nil
  local is_fp, wants_fp, centered = false
  local accessory_meshes, hidden_bones, morph_targets, address_cache = {}
```

The first set of variables is absolutely fine but if you try to use this code you'll likely come up with some errors. Can you guess why?

This is a trap that you can easily fall into if you're learning only from examples and testing only by running your scripts ingame. So as convenient as it would be if we could just set everything to the same value, unfortunately the first part only works because everything after "world" gets set to nil automatically. This is also the case for "wants_fp", "centered", "hidden_bones", "morph_targets", and "address_cache" so if you tried to add things to an empty table or set a bool to not itself you'd be trying to use a nil value

```lua
local is_fp, wants_fp, centered = false, false, false
local accessory_meshes, hidden_bones, morph_targets, address_cache = {}, {}, {}, {}
```
### Named/Order Independent Parameters

A nice feature of some "real" programming languages (and python) is the ability to define named arguments. This is another case similar to the ternary where lua has an alternative that kind of just works but isn't an actual built in feature. It requires slightly more work in both defining and calling the function but has the benefit that unlike other programming languages that typically require named arguments to come in a specific order you can use these freely. You can do this by defining a single parameter that you expect to be a table

```lua
function CreateTreeNode(args)
    if not args or type(args) ~= "table" then return end
    local label = args.label or "Node Data"
    local keys = args.keys or args.data.__orderedIndex
    local parents = args.parents or nil
    local data = args.data
    local widget = args.widget or nil
    local widget_default_args = args.widget_default_args or nil
    local root_key = args.root_key or "None"

```

### Automatic Type Conversion

Lua provides this feature in a somewhat inconsistent way that can only be rationalized by remembering that lua originated as a configuration langauge written by mathematicians. Arithmetic operations and string concatenation therefore are available without actually neeeding to write tostring and tonumber

```lua
str = "1.0"
print(str + 2.5)    -- 3.5
print(str .. 2.5)   -- 1.02.5
```
However the same rule does not apply to strings and tables.
