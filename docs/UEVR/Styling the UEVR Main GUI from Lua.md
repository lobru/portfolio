Neither of these matter as I've added a style editor directly to UEVR for the imgui update coming but these cases are worth archiving

Modern version

```lua


local functions = uevr.params.functions
UEVR_TAG = functions.get_tag()
api = uevr.api
UEVR_COMMITS_PAST_TAG = functions.get_commits_past_tag()
UEVR_COMMIT_HASH = functions.get_commit_hash()
UEVR_NAME = "UEVR ["..tostring(UEVR_TAG).."+"..tostring(UEVR_COMMITS_PAST_TAG).."-"..(tostring(UEVR_COMMIT_HASH):sub(1,8)).."]"
 colors = {
        Vector4f.new(1.00, 1.00, 1.00, 1.0),
        Vector4f.new(0.86, 0.93, 0.89, 0.68),
        Vector4f.new(0.13, 0.14, 0.17, 0.70),
        Vector4f.new(0.13, 0.14, 0.17, 1.0),
        Vector4f.new(0.31, 0.31, 1.00, 0.04),
        Vector4f.new(0.00, 0.00, 0.00, 0.00),
        Vector4f.new(0.20, 0.22, 0.27, 1.00),
        Vector4f.new(0.92, 0.18, 0.29, 0.78),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.20, 0.22, 0.27, 1.00),
        Vector4f.new(0.20, 0.22, 0.27, 0.75),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.20, 0.22, 0.27, 0.47),
        Vector4f.new(0.20, 0.22, 0.27, 1.00),
        Vector4f.new(0.09, 0.15, 0.16, 1.00),
        Vector4f.new(0.92, 0.18, 0.29, 0.78),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.71, 0.22, 0.27, 1.00),
        Vector4f.new(0.47, 0.77, 0.83, 0.14),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.47, 0.77, 0.83, 0.14),
        Vector4f.new(0.92, 0.18, 0.29, 0.86),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.92, 0.18, 0.29, 0.76),
        Vector4f.new(0.92, 0.18, 0.29, 0.86),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.14, 0.16, 0.19, 1.00),
        Vector4f.new(0.92, 0.18, 0.29, 0.78),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.47, 0.77, 0.83, 0.04),
        Vector4f.new(0.92, 0.18, 0.29, 0.78),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.86, 0.93, 0.89, 0.63),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.86, 0.93, 0.89, 0.63),
        Vector4f.new(0.92, 0.18, 0.29, 1.00),
        Vector4f.new(0.92, 0.18, 0.29, 0.43),
        Vector4f.new(0.20, 0.22, 0.27, 0.9),
        Vector4f.new(0.20, 0.22, 0.27, 0.73),
    }
function VecToU32(vec)
    local r = math.floor(math.max(0, math.min(255, vec.x * 255 + 0.5)))
    local g = math.floor(math.max(0, math.min(255, vec.y * 255 + 0.5)))
    local b = math.floor(math.max(0, math.min(255, vec.z * 255 + 0.5)))
    local a = math.floor(math.max(0, math.min(255, vec.w * 255 + 0.5)))

    -- ImGui expects 0xAABBGGRR
    return (a << 24) | (b << 16) | (g << 8) | r
end



local stylevar = {

--Alpha",
1.0,
--DisabledAlpha",
0.7,
--WindowPadding",
Vector2f.new(2.0, 2.0),
--WindowRounding",
10.0,
--WindowBorderSize",
2.0,
--WindowMinSize",
Vector2f.new(60.0, 120.0),

--WindowTitleAlign",
Vector2f.new(0.5, 0.5),

--ChildRounding",
8,
--ChildBorderSize",
2,
--PopupRounding",
10,
--PopupBorderSize",
2,
--FramePadding",
0.5,
--FrameRounding",
10,
--FrameBorderSize",
0.0,
--ItemSpacing",
Vector2f.new(2.0, 2.0),

--ItemInnerSpacing",
Vector2f.new(2.0, 2.0),

--IndentSpacing",
8,
--CellPadding",
Vector2f.new(2.0, 2.0),

--ScrollbarSize",
22,
--ScrollbarRounding",
10,
--GrabMinSize",
15,
--GrabRounding",
12,
--TabRounding",
0,
--ButtonTextAlign",
Vector2f.new(0.5, 0.5),

--SelectableTextAlign",

--SeparatorTextBorderSize",

--SeparatorTextAlign",

--SeparatorTextPadding"

}

local res
local no_inputs = false
local menu_bar = true
local no_nav = true
local set_pos = false
local set_size = false
local window_size = Vector2f.new(1000, 500)
local window_pos = res and res * 0.5 or Vector2f.new(0,0)
uevr.sdk.callbacks.on_frame(function()
    res = res or imgui.get_display_size()
    local colorcount=0
    local stylecount=0
    if functions.is_drawing_ui() then
        imgui.push_font(imgui.load_font("Comic.ttf", 16))
        for i,v in ipairs(colors) do
                colorcount = colorcount + 1
            imgui.push_style_color(i-1, VecToU32(v))
        end
        for i,v in ipairs(stylevar) do
            stylecount = stylecount +1
            imgui.push_style_var(i-1,v)
        end
        no_inputs = imgui.is_key_pressed(571)

        imgui.begin_window(UEVR_NAME, true, 0 + (no_inputs and 197120 or 0) + (menu_bar and 1024 or 0) + (no_nav and 196608 or 0))
        if imgui.begin_menu_bar() then
            if imgui.begin_menu("HACKS") then
                imgui.menu_item("Placeholder")
                imgui.end_menu()
            end
            imgui.end_menu_bar()
        end
        imgui.end_window()
        imgui.pop_style_color(colorcount)
        imgui.pop_style_var(stylecount)
        imgui.pop_font()
    end
end)



```






Original Hacky version (literally intentionally memleaked and attempted to manually prevent stack corruption to usually good results)

```lua
local excluded_colors = {Tab = true, TabHovered = true, TabActive = true, TabUnfocused = true, TabUnfocusedActive = true, PlotLines = true, PlotLinesHovered = true, PlotHistogram = true, PlotHistogramHovered = true, ModalWindowDimBg = true}
local color_edit = true
local temp_styles = {}
local jsonstyles = {}
local style_name = ""
local colors_to_pop = 0
local color_flags = ImGui.CalcFlags({"NoSidePreview", "AlphaBar", "NoBorder"}, "ColorEdit")
function ImGui.ColorStylesMenu(colorStyles)

    if colorStyles == nil then colorStyles = ImGuiThemes.default_dark.colors end
    temp_styles = temp_styles or colorStyles
    for k, v in pairs(temp_styles) do imgui.push_style_color(ImGui.Col(k), v)
                        colors_to_pop = colors_to_pop + 1

        end
        if imgui.begin_menu("Color Style Editor") then
         local available_width = math.min(imgui.get_display_size().x * 0.55, math.max(imgui.get_window_size().x * 0.85))

        -- local c, nn, s1, s2 = imgui.input_text("Style Name", style_name, 0)
        -- if c then style_name = nn end
        -- imgui.begin_disabled(style_name == nil or #style_name == 0 )
        -- if imgui.menu_item("Save") then json.dump_file("CustomThemes\\"..style_name..".json", jsonstyles, 4)

        -- end
        -- imgui.end_disabled()
        if ImGui.ToggleButton({"Use color picker widget","Use color edit widget"}, color_edit) then color_edit = not color_edit end
        if imgui.menu_item("Reset all") then temp_styles = ImGuiThemes.default_dark.colors end
        local func = color_edit and imgui.color_edit4 or imgui.color_picker4
        imgui.push_item_width(available_width)
        for idx, val in ipairs(ImGuiCol) do
                if not excluded_colors[val] then
                    imgui.push_id(idx)
                    local tcolor = temp_styles[val] or Vector4f.new(0.5, 0.5, 0.5, 1.0)
                    -- imgui.text(val) imgui.same_line()
                    local c, v = func(val, tcolor, color_flags)
                    if c then tcolor = v
                        temp_styles[val] = tcolor
                        -- imgui.push_style_color(ImGui.Col(v), tcolor)
                        -- colors_to_pop = colors_to_pop + 1

                    end
                    jsonstyles[val] = {tcolor.x, tcolor.y, tcolor.z, tcolor.w}

                    imgui.pop_id()
                end

            end
            imgui.pop_item_width()
            imgui.end_menu()
        end
        if colors_to_pop ~= 0 then imgui.pop_style_color(colors_to_pop )
        colors_to_pop = 0
    end
    colorStyles = temp_styles
    return (colorStyles ~= temp_styles), temp_styles
end


function ImGui.ColorStyleEditor(colorStyles)
    if colorStyles == nil then colorStyles = ImGuiThemes.default_dark.colors end
    if ImGui.ToggleButton({"Use color picker widget","Use color edit widget"}, color_edit) then color_edit = not color_edit end

    imgui.same_line() if imgui.small_button("Reset all") then return ImGuiThemes.default_dark.colors end
    if imgui.collapsing_header("Style Editor") then
        for idx, val in ipairs(ImGuiCol) do

            if not excluded_colors[val] then
                imgui.push_id(val)
                local tcolor = colorStyles[val] or Vector4f.new(0.5, 0.5, 0.5, 1.0)
                imgui.text(val) imgui.same_line()
                if color_edit then
                    local c, v = imgui.color_edit4(val, tcolor, 0)
                    if c then tcolor = v
                        colorStyles[val] = tcolor
                    end
                else
                    local c, v = imgui.color_picker4(val, tcolor, 0)
                    if c then tcolor = v
                        colorStyles[val] = tcolor
                    end
                end
                imgui.pop_id()
            end
        end
    end
    return colorStyles
end


```
