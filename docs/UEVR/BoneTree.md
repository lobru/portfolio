```lua
    panels["Bones"] = function()
       local function get_bone_parents(mesh, bones)
          local t = {}
          for  _, bone in ipairs(bones) do
             local p = mesh:GetParentBone(bone:to_fname())
             if p then t[bone] = p:to_string() end
           end
          return t
        end
        local function get_bone_names(mesh)
            local t = {}
            for i = 1, mesh:GetNumBones() do
                t[#t+1] = mesh:GetBoneName(i - 1)
            end
            return t
        end
        local function bone_node(idx, val)
          for _idx, _val in ipairs(all_bones) do
                if bone_parents[_val] == val and imgui.tree_node(_val) then
                         bone_node(_idx, _val)
                    imgui.tree_pop()
                end
            end
       if bone_parents == nil then
             mesh = mesh or pawn:get_mesh_component()
             all_bones = get_bone_names(mesh)
             bone_parents = get_bone_parents(mesh, all_bones)
       end

       if imgui.collapsing_header("Bones") then

            for idx, val in ipairs(all_bones) do
                if bone_parents[val] == "None" then
                    if imgui.tree_node(val) then
                         bone_node(idx, val)

                        imgui.tree_pop()
                    end
                end
            end
        end
    end
```
