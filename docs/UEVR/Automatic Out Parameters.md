The following technique allows for automatic out parameter handling when calling ufunctions. UEVR handles out arguments by putting the data into a a.result where a is an empty table passed for the out param. To retrieve the data one would need to manually create a table for every possible out param and then manually retrieve it after calling the function. However by using table.unpack and some lua memory addressing knowledge we can dynamically handle this. Everywhere, for all functions UEVR supports. The perfect example is BreakHitResult. This function allows us to pass table or actual hitresult data and split everything into tables without needing to handle UE versions changing the hitresult struct. These functions provided below can received tables with parameter names as keys and input arguments as values and will automatically fill only the needed out arguments with empty tables.


```lua

local function build_out_params(func)
    local params = func:as_function():get_child_properties()
    local out = {}
    local order = {}
    while params ~= nil do
        local p = params:get_fname():to_string()
            print(#order, p)
            local param_class = params:get_class()
            if func:as_struct():find_property(p):is_out_param() then
                out[p] = {}  -- dynamically create empty table
            end
            -- this is equivalent to table.insert but is more optimal
            order[#order+1] = p
        params = params:get_next()
    end
    return out, order
end
              
function string:find_first_of(include_cdo)
    return UEVR_UObjectHook.get_first_object_by_class(api:find_uobject(self), include_cdo)
end

-- this allows for version independent hitresult analysis 
function BreakHitResult(hitresult)
    Statics = ("Class /Script/Engine.GameplayStatics"):find_first_of(true)
    local func = Statics.BreakHitResult
    local tbls = {}

     local tbls, order = build_out_params(func)
    -- Collect arguments in order
    -- start with the hitresult already in the table

   local args = {}
   tbls["Hit"] = hitresult
    -- this is the same as table.insert, we cant just do args[i] since we have  to offset by 1
    -- for i, name in ipairs(order) do
    --     args[#args+1] = args[#args+1] or tbls[name]
    -- end
    for i, name in ipairs(order) do
        args[i] = tbls[name]
    end
    -- unpack the empty tables
    -- despite having no data in each table and
    -- despite table.unpack technically generating new values
    -- tbls still keeps references to each of them allowing us to retrieve the results
    Statics:BreakHitResult(table.unpack(args))

    -- Build results map
    -- This is simple here due to the function only taking out params
    -- but even if it didn't we would still know the order
    -- without the ordering steps we can get the data but we won't know which result goes where
    local results = { }
    for i = 2, #args do
        local name = order[i]
        results[name] =  tbls[name].result
    end
    return results
end
```

Here's a version specific implementation that only works for BreakHitResult and won't handle future version changes if they occur
```lua
function M.getCleanHitResult(hitResult)
	if hitResult ~= nil then
		local bBlockingHit = {}
		local bInitialOverlap = {}
		local Time = {}
		local Distance = {}
		local Location = {}
		local ImpactPoint = {}
		local Normal = {}
		local ImpactNormal = {}
		local PhysMat = {}
		local HitActor = {}
		local HitComponent = {}
		local HitBoneName = {}
		local HitItem = {}
		local ElementIndex = {}
		local FaceIndex = {}
		local TraceStart = {}
		local TraceEnd = {}

		--static void BreakHitResult(const struct FHitResult& Hit, bool* bBlockingHit, bool* bInitialOverlap, float* Time, float* Distance, struct FVector* Location, struct FVector* ImpactPoint, struct FVector* Normal, struct FVector* ImpactNormal, class UPhysicalMaterial** PhysMat, class AActor** HitActor, class UPrimitiveComponent** HitComponent, class FName* HitBoneName, class FName* BoneName, int32* HitItem, int32* ElementIndex, int32* FaceIndex, struct FVector* TraceStart, struct FVector* TraceEnd);
		local success = pcall(function()
			Statics:BreakHitResult(hitResult, bBlockingHit, bInitialOverlap, Time, Distance, Location, ImpactPoint, Normal, ImpactNormal, PhysMat, HitActor, HitComponent, HitBoneName, HitItem, ElementIndex, FaceIndex, TraceStart, TraceEnd )
		end)
		if not success then
			--M.print("BreakHitResult failed, falling back to hitResult fields", LogLevel.Warning)
		end

		local details = {}
		details.FaceIndex = hitResult.FaceIndex
		details.Time = hitResult.Time
		details.Distance = hitResult.Distance
		details.Location = M.vector(hitResult.Location)
		details.ImpactPoint = M.vector(hitResult.ImpactPoint)
		details.Normal = M.vector(hitResult.Normal)
		details.ImpactNormal = M.vector(hitResult.ImpactNormal)
		details.TraceStart = M.vector(hitResult.TraceStart)
		details.TraceEnd = M.vector(hitResult.TraceEnd)
		details.PenetrationDepth = hitResult.PenetrationDepth
		details.Item = hitResult.Item
		details.ElementIndex = hitResult.ElementIndex
		details.bBlockingHit = hitResult.bBlockingHit
		details.bStartPenetrating = hitResult.bStartPenetrating
		details.PhysMaterial = PhysMat.result
		details.Actor = HitActor.result
		details.Component = HitComponent.result
		details.BoneName = HitBoneName.result and HitBoneName.result:to_string() or nil
		details.MyBoneName = hitResult.MyBoneName and hitResult.MyBoneName:to_string() or nil
		return details
	end
	return nil
end


```

Which one is better?
