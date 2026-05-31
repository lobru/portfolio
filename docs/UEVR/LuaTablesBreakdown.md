## Tables, Arrays, Sequences
Tables are the core data structure of Lua. *Array* and *Sequence* are both terms used to describe numerically indexed lua tables
e.g. 
```lua
arr = {"a", "b", "c"}
print(arr[1])
-- > a
```
Unlike other programming languages tables go from 1 to the length of the table instead of starting at 0. You can get the length of an array with `#` or with the *metamethod* `__len` 
e.g. 
```lua
print(#arr)
-- > 3
```
Lua tables can also use key value pairs and while anything can technically be a key you generally will use strings. Key-value-pair tables must be iterated with `pairs` which does not respect order. They are needed for storage and can be used for max speed accessing with a lookup table. To get around the ordering issue you should have another table to track the index. This can be hidden in a convenient way. You should use my orderedPairs implementation to simplify all of this

Arrays are the optimal type of lua table as they can be iterated in order with `ipairs` or direct numeric indexing, e.g.
```lua
for i = 1, #t do
  local value = t[i]
end
```

## Colon Syntax
Unlike other lua types you cannot call any of the table functions on a table with colon syntax by default. This is because every table created with the `{}` operator has its own unique metatable for unclear reasons. To achieve behavior similar to other lua types and usertypes you can manually set the metatable to a proxy that points to `table`

```lua
local tablemt = {__index = table}
function T(t)
	return setmetatable(t or {}, tablemt)
end
```

When calling from `table` lua will automatically recognize the input table as a table. But when calling from the table object with a colon it will only work if the metatable is set ahead of time.

```lua
	function table:extend(src)
	    return table.move(src, 1, #src, #self + 1, self)
	end
```
You can still use this function from `table` even if the metatables have not been set for the input tables.
```lua
	table.extend({1,2}, {3,4})
	--{1,2,3,4}
```

`setmetatable` does return the input table so you can use it directly like so if you prefer to write this inline. 
```lua
	setmetatable({1,2}, {__index = table}):extend({3,4})
```

This syntax works too
```lua
	print(setmetatable({1,2}, {__index = table}):extend({3,4})[3])
```


```lua
function table:merge(src)
    for k, v in pairs(src) do
        self[k] = v
    end
    return self
end

function table:contains(element)
    if self == nil then
        return false
    end

    for _, value in pairs(self) do
        if value == element then
            return true
        end
    end
    return false
end

function table:empty()
    return (not self or not next(self)) and true or false
end
```
### Adding Elements

You can call table.insert(t, element) to add an item to the end of the table or table.insert(t, element, i) to insert at position i
```lua
local x  = {1,2,3}
table.insert(x, 1, 4)
print(x[1])
--> 4 
```
For insertions at the end you should ignore table.insert and instead use `_table[#_table+1] = newval`. Don't overthink it, its just a little bit faster and is honestly quicker to type than table.insert
```lua
local x = {1, 2, 3}
x[#x+1] = 4
print(x[4])
--> 4
```

### Removing Elements
For arrays you must iterate in reverse or removing elements will break things
```lua
for i = #t, 1, -1 do
  local v = t[i]
  if not is_good(v) then
    table.remove(t, i)
  end
end
```
For other tables you can just set values to nil if you're not trying to use the elements in the table
```lua
function wipe_table(t)
	while true do
		local k = next(t)
		if not k then break end
		t[k] = nil
	end
end
```


## Metatables
These provide class-like features in lua and allow objects to act like different types. `__index` pretends an object is a table

**Accessing Container Elements**
The information specifically regarding accessing elements applies to all tables as well as any object that has been assigned a metatable with an `__index` function assigned. e.g. you can use `vec["x"]` on a `Vector3f` 
 
```lua
local table1 = {
    "entry1", "entry2"
}
```
this is perfectly valid, entry1 and entry2 are string entries
```lua
local table1 = {
    entry1, entry2
}
```
this is probably not valid. entry1 and entry2 are pointers to variables, so if they don't exist you've attempted to index a nil value
```lua
local table1 = {
    entry1 = "entry2", entry3 = {
        "entry4", "entry5"
    }
}
```
now entry1 is completely valid since we are assigning the value in the same step. You can access it with table1.entry1, but since we assigned a value to it that means its also a string index so we can access it with table1["entry1"]
That may seem redundant so let's look at a couple more examples.

this is absolutely not valid due to the whitespace

```lua
local table1 = {
    entry 1 = "entry2"
}
```

this is valid. You can access it with table1["entry 1"] but not with dot notation
```lua
local table1 = {
    "entry 1" = "entry2"
}
```

## Ordered Pairs

Lua tables only retain order when using numerical indexing. Therefore using `pairs` to iterate string keys will not preserve order. 


```lua

function __genOrderedIndex(t)
  local orderedIndex = t.__orderedIndex or setmetatable({},{__index = table})
  t.__keys = t.__keys or setmetatable({},{__index = table})
  t.__lookup = t.__lookup or setmetatable({},{__index = table})
    -- ensure correct sorting for rotator to Vector3 handling
  -- idk why its like this but it is
  if #t == 3 and (t.pitch or t.Pitch) then
    return {"Pitch", "Yaw", "Roll"}
  end
  for key in pairs(t) do
      orderedIndex[#orderedIndex+1] =  type(key) == "string" and key or tostring(key)
        t.__lookup[t[key]] = key
  end
  orderedIndex:sort()

  return orderedIndex
end


function find_ordered_key(tbl, key)
  local index = tbl.__keys and tbl.__keys[key]
  return index or nil
end


function ordered_lookup(tbl, value)
  local key = tbl.__lookup and tbl.__lookup[value]
  return key or nil
end



-- pairs does not maintain order. maybe you heard this and like me thought it was no big deal and only matters for storage
-- but its actually borderline unusable. we are fixing that
-- normally this will generate a hidden table with the ordered index based on alphabetical order
-- but you can instead provide a table with the correct order in the orderedPairs function
-- this is crucial for dynamic param-building functions like BreakhitResult which requires empty table values with string keys
function orderedNext(t, state)
  if not t then return end

    t.__lookup = t.__lookup or setmetatable({},{__index = table})
  local key = (t.__ordered_index ~= nil and state == nil) and t.__ordered_index[1] or nil
  --print("orderedNext: state = "..tostring(state) )
  if state == nil and t.__ordered_index == nil then
    -- the first time, generate the index
    t.__ordered_index = t.__orderedIndex or __genOrderedIndex(t)
      if not t.__keys then t.__keys = {}
        for i = 1, #t.__ordered_index do
                t.__keys[t.__ordered_index[i]] = i
            end
        end
    key = t.__ordered_index[1]

  else
    -- fetch the next value
    for i = 1, #t.__ordered_index do
      if t.__ordered_index[i] == state then
        key = t.__ordered_index[i + 1]
      end
    end
  end

  if key and key ~= "__lookup" and key ~= "__keys" then
      if t[key] then
        t.__lookup[t[key]] = key
      end
    return key, t[key]
  end
    t.ordered_index = nil
  return
end


-- this is how you actually iterate an ordered table
-- if no orderedIndex exists yet we construct it on the first try
-- if this is an array we just call ipairs so everything works as expected
-- you can prebuild your orderedIndex, directly assign it, or pass it here
-- if you want to you can override pairs with orderedPairs in a local variable in your own script
function orderedPairs(t, orderedIndex)
    t = T(t)
    if is_array(t) then
     return ipairs(t)
    end
    if orderedIndex ~= nil then
    t.__orderedIndex = orderedIndex
    end
  return orderedNext, t, nil
end

-- basically python zip
-- takes two arrays already in correct order and splices them into an orderedTable
function build_ordered_table(keys, values)
  local t = {}
  t.__lookup = {}
  assert(is_array(keys) and is_array(values))
  for i = 1, #keys do
    t[keys[i]] = values[i]
    t.__keys[keys[i]] = i
    t.__lookup[values[i]] = keys[i]
  end
  t.__orderedIndex = keys
  return t
end

-- this is what I use most of the time
-- very straight forward and simple to use
function ordered_insert(tbl, new_key, new_value)
  tbl.__orderedIndex = tbl.__orderedIndex or setmetatable({},{__index = table})
  tbl.__lookup = tbl.__lookup or setmetatable({},{__index = table})
  tbl.__keys = tbl.__keys or setmetatable({},{__index = table})
  local t = tbl.__orderedIndex
  -- only update insertion order if its new
  if tbl[new_key] == nil then
    t[#t+1] = new_key
    tbl.__keys[new_key] = #t
  end
  tbl[new_key] = new_value
  tbl.__lookup[new_value] = new_key
  return tbl
end


```
