// ════════════════════════════════════════════════════════════════════════
//  PROGRESS DATA — schema for the dashboard.
// ════════════════════════════════════════════════════════════════════════
//
//  This file is the single source of truth the dashboard renders. To
//  retarget the template to a new project, replace the values below with
//  data extracted from your own Claude Code progress docs. The shape
//  matters; the values are yours.
//
//  TOP-LEVEL KEYS
//    meta         project / branch / last-updated header info
//    vitals       big numbers at the top
//    cards        kanban items: every shipped / in-progress feature + fix
//    symptoms     open issues — what's broken right now
//    plan         numbered fix plan / next steps
//    edges        dependency arrows for the graph: { from, to }
//    scripts      any tabular audit (rename to anything tabular you have)
//    files        files touched + change-count + change descriptions
//    sideTasks    sibling repos / parallel workstreams
//    milestones   roadmap entries — { date, label, kind }
//
//  CARD STATUS  "shipped" · "in-progress" · "open"
//  MILESTONE KIND  "ship" · "in-progress" · "audit" · "next"
//
//  Replace this whole object and the dashboard reflows automatically.
//  See docs/ for the example Claude Code output this dataset was built from.
// ════════════════════════════════════════════════════════════════════════

window.PROGRESS_DATA = {
  meta: {
    project:     "UEVR",
    branch:      "luavrlib",
    version:     "luavrlib-2026-06",
    baseline:    "praydog/UEVR · master",
    repoPath:    "UEVR · luavrlib",
    repoUrl:     "https://github.com/lobotomy-x/UEVR/tree/luavrlib",
    lastUpdated: "2026-06-11",
    docCount:    8,
    sessionId:   "luavrlib · reflection workbench 2026-06",

    // ─── Dev-view header split ─────────────────────────────────────
    // Controls the colored split: titlePrefix + titleAccent + titleSuffix
    titlePrefix: "UEVR ",
    titleAccent: "luavrlib",
    titleSuffix: "",

    // ─── Overview fields ───────────────────────────────────────────
    eyebrow:     "C++ · Lua · Unreal Engine · Dear ImGui",
    tagline:     "Extended UEVR's scripting surface with faster APIs, threaded workers, and a live function editor.",
    description: "Extended UEVR's Lua scripting layer with tools for the modding community: faster ways to move and query in-game actors, background scripting threads, a reflection-driven class browser, and an interactive editor for calling game functions in real time. (UEVR is the platform that brings any modern Unreal Engine game into VR with full head and controller tracking.)",

    author:   "Logan Brunet",
    role:     "Engines · Graphics · UI / Tools · Offensive Security",
    location: "Orlando, FL",
    heroShot: {
      src: "media/uevr-luavrlib/class-browser-function-caller.png",
      caption: "Reflection-driven Class Browser, live Function Caller, and luavrlib panels — all docked via multi-viewport inside the injected DLL",
    },
    gallery: [
      { src: "media/uevr-luavrlib/class-browser-function-caller.png", caption: "Class Browser + Function Caller + docked UEVR panels, running in-game" },
    ],
    linkedIn: "https://linkedin.com/in/logan-brunet",
    github:   "https://github.com/lobotomy-x",
    docsUrl:  "uevr-lua-docs.html",
    portfolioUrl: "https://lobru.github.io/portfolio/",

    // Fork / contributor history — collapsed <details> dropdown
    credits: [
      { name: "praydog",  handle: "praydog",  role: "UEVR original author · 2023–present",    url: "https://github.com/praydog/UEVR" },
    ],

    // Impact numbers — real numbers only
    impactNumbers: [
      { num: "30+",  label: "features + fixes", sub: "shipped on the luavrlib branch" },
      { num: "5 yr", label: "ImGui upgrade",    sub: "pre-docking → v1.92 · multi-viewport in an injected DLL" },
      { num: "8 wk", label: "active sprint",    sub: "April 14 → June 11, 2026" },
    ],

    // §01 — What was added (plain English, no class/function names)
    featuresAdded: [
      { name: "Dear ImGui multi-year upgrade",
        desc: "Brought the in-engine ImGui rendering stack forward roughly 5 years of upstream releases — from the pre-docking branch to v1.92 with full docking and multi-viewport (pop-out windows). Multi-viewport in an injected DLL context is unprecedented; the only comparable work is in native Unreal Engine ImGui plugins that have privileged access to platform process APIs." },
      { name: "Fast actor transforms",
        desc: "A new shortcut lets scripts move, rotate, and query in-game actors without going through the full reflection system — 3–5× faster per call." },
      { name: "Background scripting threads",
        desc: "Scripts can now spawn worker threads that run in the background and share data with the main script without stalling the game." },
      { name: "Full property-type coverage",
        desc: "Reading arrays of numbers, strings, or objects from the game engine now returns correct values for every type, and the inspector surfaces the harder Unreal property kinds (weak / lazy / soft references, delegates, maps, sets) that previously returned nothing." },
      { name: "Universal object picker + struct call params",
        desc: "One reusable widget for every object-typed slot — drag a target in, type a name or address, or search a pick popup with quick-picks (World / PlayerController / Pawn / Camera). Calling a function now flattens any struct parameter (even a nested FTransform) into editable fields, sized from the engine's own layout so there's no UE4-vs-UE5 padding guesswork." },
      { name: "Reflection workbench — Class Browser, Function Caller, instance inspector",
        desc: "Dockable Class Browser and Function Caller windows, an instance inspector pane, and a function list you can group by the class that declares each function — a full reflection workbench for poking at a running game's objects." },
      { name: "Transform gizmo + sidebar dev tools",
        desc: "A screen-space gizmo translates and rotates the selected component by dragging (tunable axis length, world scale, quaternion rotation, reset, multi-axis), alongside a dev-tools sidebar: selection, freecam and camera modes, pause, and batch editing of collision shapes." },
      { name: "Lua scripting IDE plugin",
        desc: "A built-in scripting plugin with a live REPL, object inspector, VR, console, and bridge tabs — so you can write and iterate on Unreal VR scripts without leaving the game." },
      { name: "Crash hardening across the Lua layer",
        desc: "A bad script can no longer take down the game: script resets, the C plugin interface, and identity-quaternion math were all hardened after an adversarial review found and fixed the edge cases." },
    ],

    // §02 — Highlight card IDs (6 showing breadth)
    highlights: [
      "imgui-upgrade", "workers", "live-caller",
      "tarray", "glm", "treepop",
    ],

    // Tech stack chips (hero right column)
    techStack: [
      "C++20", "Lua / Sol2", "Dear ImGui",
      "DirectX 11/12", "Unreal Engine", "asmjit",
    ],

    // Customise the "Language support" section for this project — it's a Lua script audit.
    scriptsSection: {
      num: "06",
      title: "Lua script audit",
      aside: "23 scripts reviewed",
      head: "Lua script audit · 20 pass · 2 rewritten · 1 new",
      headAside: "23 total",
      tableHeader: ["file", "date", "status", "notes"],
    },

    // Audience bullets for About section
    audience: [
      "VR modders building per-game profiles and overlays",
      "AI tooling developers wiring agents into running Unreal games",
      "Engine programmers debugging game state from a live script console",
    ],

    // Videos — add { src, poster?, caption? } when screen captures are ready
    videos: [],

    // Gallery — add { src, caption } to enable the Gallery section in Dev view
    gallery: [],
  },

  // Top-level vitals — the numbers that anchor the header.
  vitals: {
    shipped: 32,
    inProgress: 2,
    open: 3,
    blocked: 0,
    scriptsAudited: 23,
    scriptsRewritten: 2,
    scriptsNew: 1,
    filesTouched: 4,
    cppFiles: 4,
    luaFiles: 23,
  },

  // ───────────── Kanban: every change as a card. ─────────────
  cards: [
    // ── SHIPPED · Reflection Workbench (June) ──
    {
      id: "object-picker",
      title: "Universal object picker (T63)",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["new-surface", "ux"],
      blurb: "One reusable widget for every UObject param + caller slot: drop target, short-name / 0xADDR text resolve, searchable pick popup, common-object quick-picks, instances↔classes toggle.",
      detail: "Quick-picks resolve World / PlayerController / Pawn / Camera; gather_common_objects is memoized per ImGui frame. Replaces the bespoke per-slot pickers everywhere a UObject is needed.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "struct-params",
      title: "Generic struct call params (T64)",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["new-surface", "reflection"],
      blurb: "collect_struct_leaves recursively flattens any struct param to scalar leaves — FTransform → Rotation / Translation / Scale3D — each field width driven by its own FProperty.",
      detail: "Walks the SuperStruct chain so inheriting structs encode completely; every nested write is bounds-checked against the param buffer. Non-numeric structs fall back to an editable inline-Lua snippet. No UE4/UE5 padding guesswork.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "class-browser",
      title: "Dockable Class Browser + Function Caller windows",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["new-surface", "ux"],
      blurb: "Standalone dockable windows: Class Browser (Classes / ScriptStructs / Enums / Functions tabs, filter, drag sources) and a Function Caller sharing state with the inline caller.",
      detail: "Plus a text-input fallback on every drop target — type a short name, full Class /Script/... name, or 0xADDR and hit Enter to resolve. Mirrors the Scripts/ImGui.lua object_lookup pattern.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "group-by-class",
      title: "Group functions by declaring class",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["ux"],
      blurb: "Toggle that splits a flat function list into per-declaring-class tree nodes (most-derived first, with counts) instead of one alphabetical wall.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "gizmo",
      title: "Screen-space transform gizmo + dev sidebar",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["new-surface", "ux"],
      blurb: "Drag a screen-space gizmo to translate / rotate the selected component (tunable axis length, world scale, quaternion rotation, reset, multi-axis), plus a dev-tools sidebar.",
      detail: "Sidebar: selection, freecam + camera modes, pause, and batch editing of ShapeComponents. Middle-mouse drag-to-pan works in every scroll region.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "lua-ide-plugin",
      title: "Lua scripting IDE plugin (v2)",
      status: "shipped",
      group: "Lua API",
      tags: ["new-surface", "tooling"],
      blurb: "Built-in lua_imgui_plugin with REPL, UObject inspector, VR, Console, and Bridge tabs for writing Unreal VR scripts in-game.",
      detail: "Shipped alongside api_test_plugin; the C plugin interface (PluginLoader) had 13 missing function-pointer fields wired so C plugins no longer crash on those calls.",
      files: ["lua-api/plugins/lua_imgui_plugin.cpp", "lua-api/PluginLoader.cpp"],
    },
    {
      id: "lua-crash-guard",
      title: "Lua crash hardening + C-API review",
      status: "shipped",
      group: "Lua API",
      tags: ["bug-fix", "crash-fix"],
      blurb: "reset_scripts wraps each script in try/catch so a Lua panic can't take down the frame loop; identity-quaternion and broken ImGui color bindings fixed in a consolidated review.",
      detail: "Quaternion(0,0,0,1) is a 180° rotation under glm's (w,x,y,z) ctor → fixed to (1,0,0,0). ColorPicker4 / ColorEdit4 / drawlist ImU32 bindings repaired. Three missing C-API pointers (get_or_add_component, attach_to, get_angular_velocity) wired.",
      files: ["src/mods/LuaLoader.cpp", "lua-api/datatypes/Transform.cpp", "lua-api/api/imgui_bindings.cpp"],
    },

    // ── SHIPPED · Lua API ──
    {
      id: "api-fast",
      title: "uevr.api_fast namespace",
      status: "shipped",
      group: "Lua API",
      tags: ["new-surface", "perf"],
      blurb: "Direct sdk::AActor / sdk::USceneComponent accessors that bypass the generic reflection chain.",
      detail: "Same underlying process_event per call — but no Lua-side __index lookup, sol2 argument marshalling, or StructObject return wrap. Roughly 3–5× faster per call on synthetic benchmarks.",
      surface: [
        "get_actor_location / get_actor_rotation",
        "set_actor_location / set_actor_rotation",
        "get_root_component / get_component_by_class / get_all_components",
        "get_world_location / get_world_rotation",
        "set_world_location / set_world_rotation",
        "add_world_offset / add_world_rotation",
        "set_local_transform  (composite — loc+quat+scale in one K2_SetWorldTransform)",
        "get_socket_location / get_socket_rotation",
        "is_actor / is_scene_component",
        "batch_actor_locations  (one sol2 crossing → N locations)",
        "destroy_actor",
      ],
      files: ["lua-api/api/api_fast.cpp", "lua-api/api/api_fast.hpp"],
      perfBars: [
        { label: "reflection chain", pct: 100, baseline: true },
        { label: "api_fast (single)", pct: 28 },
        { label: "api_fast (batched)", pct: 9 },
      ],
    },
    {
      id: "workers",
      title: "Multistate / worker threads",
      status: "shipped",
      group: "Lua API",
      tags: ["new-surface", "threading"],
      blurb: "Background Lua states on their own threads with a cross-state shared map.",
      detail: "Workers own a private ScriptState (no uevr.api surface — most of that is not thread-safe) and communicate via set_shared / get_shared. stop_worker is non-blocking: it flips the worker's stop flag, hands the thread.join off to a detached janitor, and returns immediately — so calling it from a script panel button never freezes the render thread.",
      surface: [
        "uevr.spawn_worker(name, bootstrap_source?)",
        "uevr.send_to_worker(name, source)",
        "uevr.stop_worker(name)  — non-blocking, janitor joins",
        "uevr.has_worker(name)",
        "uevr.set_shared(key, value)  — int/double/float/string/bool",
        "uevr.get_shared(key)",
        "uevr.run_on_game_thread(fn)",
        "uevr.log_info / log_warn / log_error  — workers tagged [lua-worker]",
      ],
      files: ["lua-api/api/workers.cpp"],
    },
    {
      id: "tarray",
      title: "TArray<T> read paths fixed",
      status: "shipped",
      group: "Lua API",
      tags: ["bug-fix", "lua-bindings"],
      blurb: "ArrayProperty reads now return a real Lua table for primitives, FName, FString, UObject*, Struct.",
      detail: "Old code cast all of these as TArray<T*> and walked sizeof(void*) per element, which produced half-length garbage for primitive arrays.",
      surface: [
        "FloatProperty / DoubleProperty (+ all sized int / uint variants)",
        "BoolProperty  → lua booleans",
        "NameProperty  → FName usertype values",
        "StrProperty   → wstring per inline FString",
        "ObjectProperty / InterfaceProperty / ClassProperty",
        "StructProperty (StructObject elements, sized via UScriptStruct)",
      ],
      files: ["lua-api/api/tarray.cpp"],
    },
    {
      id: "glm",
      title: "GLM bindings — full rewrite",
      status: "shipped",
      group: "Lua API",
      tags: ["new-surface", "rewrite"],
      blurb: "Vector / Quat / Matrix / Transform with float + double precision and full metamethod surface.",
      detail: "Per-arity operator overloads, cross-precision and cross-arity conversions, full quaternion and matrix algebra.",
      surface: [
        "Vector2/3/4 — float + double, full operator overloads",
        "to_vec3d / to_vec3f / to_vec2 / to_vec3 / to_vec4",
        "Quat: identity, slerp, conjugate, inverse, rotator, to_mat4, q·vec",
        "Mat4: identity, decompose, inverse, transpose, determinant, transform_point",
        "Transform: compose, inverse, relative, to_matrix/from_matrix",
      ],
      files: ["lua-api/api/glm_bindings.cpp"],
    },
    {
      id: "imgui-cleanup",
      title: "ImGui binding cleanup",
      status: "shipped",
      group: "Lua API",
      tags: ["cleanup", "lua-bindings"],
      blurb: "bindings::open_imgui deduplicated from 498 lines / 207 unique → 207 alphabetical entries.",
      newApis: [
        "accept_payload", "activate_item_by_id",
        "begin_drag_drop_source", "begin_drag_drop_target", "set_drag_drop_payload",
        "vslider_float", "create_platform_window",
        "bullet_text", "text_colored",
        "path_arc_to", "path_arc_to_fast",
        "path_bezier_cubic_curve_to", "path_bezier_quadratic_curve_to",
        "path_clear", "path_elliptical_arc_to",
        "path_fill_convex", "path_line_to", "path_line_to_merge_duplicate",
        "path_rect", "path_stroke",
      ],
      files: ["lua-api/api/imgui_bindings.cpp"],
      stats: { before: 498, after: 207, deltaPct: -58 },
    },
    {
      id: "midhooks",
      title: "Custom inline / mid hooks from Lua",
      status: "shipped",
      group: "Lua API",
      tags: ["new-surface", "advanced"],
      blurb: "uevr.hook_create_mid + uevr.call_function — raw native calls with full register frame access.",
      detail: "ctx is a UEVR_HookContext usertype with GPRs, rflags, rip, and read/write memory helpers. Modifying ctx.* writes back into the target's saved register frame when the hook returns. call_function uses an asmjit-generated stub that respects the Windows x64 ABI.",
      files: ["lua-api/api/midhooks.cpp"],
    },

    // ── SHIPPED · UObjectHook menu ──
    {
      id: "live-caller",
      title: "Live Function Caller",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["new-surface", "ux", "pinned"],
      blurb: "Pinned workbench panel at the top of UObjectHook → Main with 4 fixed slots.",
      detail: "Each slot accepts a drag-and-dropped UObject (from any TreeNode in the view), an InputText for a function name, and a Resolve button (or Enter in the input). Avoids drilling through Objects-by-class → SomeUClass → SomeObject → Functions → fn every time you want to invoke the same function on a specific actor.",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "drag-drop",
      title: "Drag-and-drop on UObject / UClass TreeNodes",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["ux", "infra"],
      blurb: 'Every UObject TreeNode now publishes a "UEVR_UObject" drag payload; UClass entries publish "UEVR_UClass".',
      targets: [
        "Live Function Caller's object slot",
        "ObjectProperty / InterfaceProperty / ClassProperty param widgets",
      ],
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "fn-editor",
      title: "Function-call editor — full rewrite",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["rewrite", "ux"],
      blurb: 'Replaces the old "Call / Enable / Disable / Hello-world!" buttons with a real per-property editor.',
      detail: "render_function_call assembles a params buffer of fn->get_properties_size() bytes, walks the parameter list to write each field at its property offset, runs process_event, then displays the return value.",
      surface: [
        "BoolProperty → Checkbox",
        "Byte / Int8 / Int16 / UInt16 / Int / UInt32 / Enum → InputInt",
        "Int64 / UInt64 → InputScalar S64/U64",
        "Float → DragFloat",
        "Double → DragScalar (double)",
        "Name / Str / Text → InputText",
        "Object / Interface / Class → drag-drop target",
        "StructProperty (Vec/Vec2/Vec4/Rotator/Quat/LinearColor) → DragFloat2/3/4",
      ],
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "pretty-print",
      title: "Return-value pretty-printing",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["polish", "ux"],
      blurb: "ObjectProperty / ClassProperty returns show [address] FullName instead of just the raw address.",
      detail: "StructProperty returns are formatted inline for the well-known POD structs (Vector, Vector2D, Vector4, Rotator, Quat, LinearColor); UE4 vs UE5 vector size is detected at runtime via sdk::ScriptVector::static_struct()->get_struct_size().",
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },
    {
      id: "treepop",
      title: "Missing-TreePop hardening",
      status: "shipped",
      group: "UObjectHook UI",
      tags: ["bug-fix", "crash-fix", "defensive"],
      blurb: 'The "Objects by class" view used operator[] on a unordered_map<*, unique_ptr<MetaObject>>.',
      detail: "When the key was missing the map silently default-inserted a null unique_ptr (mutating under a read-only shared_lock!) and the next ->full_name deref crashed inside the TreeNode body, leaving the parent TreeNode unbalanced. ImGui's end-of-frame recovery then fired \"Missing TreePop()\" every time the view was opened with a concurrently-removing UObject.",
      fix: "Replaced with a find()-based get_meta() helper that returns nullptr and skips that entry, and wrapped every TreeNode with a utility::ScopeGuard that calls TreePop on scope exit.",
      alsoAppliedTo: [
        "ui_handle_array_property struct-element loop",
        "ui_handle_struct Inheritance / Functions / Properties tree nodes",
      ],
      files: ["src/mods/uobjecthook/UObjectHook.cpp"],
    },

    // ── SHIPPED · Renderer crash fixes (on luavrlib branch already) ──
    {
      id: "dx12-black",
      title: "DX12 secondary windows rendered black",
      status: "shipped",
      group: "Renderer",
      tags: ["bug-fix"],
      blurb: "RSSetViewports(3 → 1) — secondary swap-chain expected one viewport, not three.",
      files: ["src/uevr-imgui/imgui_impl_dx12.cpp"],
    },
    {
      id: "dx11-assert",
      title: "DX11 first-popup IM_ASSERT",
      status: "shipped",
      group: "Renderer",
      tags: ["bug-fix"],
      blurb: "Swap-chain template installed in imgui_impl_dx11.cpp::Init; memcpy size fix in SetSwapChainDescs.",
      files: ["src/uevr-imgui/imgui_impl_dx11.cpp"],
    },
    {
      id: "dx11-recursion",
      title: "Stack overflow when dragging a window out (DX11)",
      status: "shipped",
      group: "Renderer",
      tags: ["crash-fix"],
      blurb: "Recursion guard (thread_local s_in_d3d11_frame / s_in_d3d12_frame) added to on_frame_d3d11 / on_frame_d3d12.",
      detail: "Caused by: on_frame_d3d11 → RenderPlatformWindowsDefault → vd->SwapChain->Present → D3D11Hook (hooks ALL swapchains) → on_frame_d3d11 → ...",
      files: ["src/Framework.cpp"],
    },

    // ── IN PROGRESS · Multi-viewport ──
    {
      id: "mv-pump",
      title: "pump_secondary_viewport_messages()",
      status: "in-progress",
      group: "Multi-viewport (re-enabled)",
      tags: ["candidate-fix", "input"],
      blurb: "Walks platform_io.Viewports[1..] after RenderPlatformWindowsDefault, pumping per-popup HWND messages.",
      detail: "Win32 queues messages PER THREAD, and the thread that called CreateWindowEx owns that window's queue. ImGui's CreateWindow callback runs on the present thread (the renderer requires it — DX11 immediate context isn't thread-safe), but only the game thread pumps messages. The helper runs PeekMessageW + TranslateMessage + DispatchMessageW per popup HWND so their messages actually reach ImGui_ImplWin32_WndProcHandler_PlatformWindow.",
      files: ["src/Framework.cpp"],
    },
    {
      id: "mv-topmost",
      title: "Unconditional WS_EX_TOPMOST for popups",
      status: "in-progress",
      group: "Multi-viewport (re-enabled)",
      tags: ["candidate-fix", "z-order"],
      blurb: "ImGui_ImplWin32_GetWin32StyleFromViewportFlags — keep popups above the game window always.",
      detail: "ImGui's default is WS_EX_TOPMOST only if ImGuiViewportFlags_TopMost is set; for our use case (VR mod, desktop is a single-app debug surface) it makes more sense to keep popups above the game always.",
      files: ["src/uevr-imgui/imgui_impl_win32.cpp"],
    },
  ],

  // ───────────── Open symptoms — what's still broken with viewports on. ─────────────
  symptoms: [
    {
      id: "mouse-locked",
      title: "Mouse is locked to the game's host window",
      detail: "Moving the cursor over a popped-out ImGui window does not generate ImGui mouse input — the cursor visibly hovers the popup but clicks land in the game window beneath it.",
      severity: "high",
    },
    {
      id: "kb-never-reaches",
      title: "Keyboard input never reaches popped-out windows",
      detail: "WM_CHAR / WM_KEYDOWN for a focused popup go to the game's WndProc rather than ImGui's per-viewport handler.",
      severity: "high",
    },
    {
      id: "z-order-regression",
      title: "Main overlay z-orders behind game window after popup drag-out",
      detail: "Especially with DX11. Windows promotes the active window to the top of z-order on SetFocus; on release, the OS does not automatically restore the previous foreground window.",
      severity: "medium",
    },
  ],

  // ───────────── 4-step plan for the real fix. ─────────────
  plan: [
    {
      step: 1,
      title: "Audit the platform WndProc plumbing",
      detail: "Diff src/uevr-imgui/imgui_impl_win32.cpp::ImGui_ImplWin32_CreateWindow against upstream Dear ImGui v1.92.5 and re-enable any defensive removals that broke the per-viewport WndProc registration. Run with SPDLOG_DEBUG on the create/destroy paths to confirm the new HWND has the expected WNDCLASS.",
      checks: [
        'ImGui_ImplWin32_CreateWindow registers the "ImGui Platform" WNDCLASS',
        "lpfnWndProc is ImGui_ImplWin32_WndProcHandler_PlatformWindow",
        "Handler is not short-circuited to DefWindowProc",
        "HWND's WndProc isn't clobbered by a later SetWindowLongPtr",
      ],
      state: "pending",
    },
    {
      step: 2,
      title: "Smoke-test mouse routing",
      detail: "With multi-viewport on, log GetForegroundWindow each frame from the engine-tick hook. If it's the popup HWND, ImGui should be reading mouse pos relative to that HWND, not the game's. Trace WantSetMousePos and MousePos.",
      state: "pending",
    },
    {
      step: 3,
      title: "Z-order restoration on popup destroy",
      detail: "Subclass the popup window's WNDPROC for WM_DESTROY to call SetWindowPos(game_hwnd, HWND_TOP, ..., SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE) so the game overlay comes back to the top.",
      state: "pending",
    },
    {
      step: 4,
      title: "DX11 first-frame race",
      detail: "Even with the recursion guard, DX11 secondary swapchains are created on the engine thread but presented on the present thread. Confirm RenderPlatformWindowsDefault is only called from the present-thread on_frame_d3d11 path (not engine-tick), and that m_immediate_context is fetched per-frame.",
      state: "pending",
    },
  ],

  // ───────────── Dependencies between cards for the graph. ─────────────
  edges: [
    { from: "drag-drop", to: "live-caller" },
    { from: "drag-drop", to: "fn-editor" },
    { from: "fn-editor", to: "live-caller" },
    { from: "fn-editor", to: "pretty-print" },
    { from: "pretty-print", to: "live-caller" },
    { from: "treepop", to: "live-caller" },
    { from: "api-fast", to: "side-uevrlib" },
    { from: "api-fast", to: "side-mcp" },
    { from: "workers", to: "side-uevrlib" },
    { from: "workers", to: "side-mcp" },
    { from: "glm", to: "side-uevrlib" },
    { from: "tarray", to: "side-uevrlib" },
    { from: "tarray", to: "side-mcp" },
    { from: "midhooks", to: "side-mcp" },
    { from: "imgui-cleanup", to: "drag-drop" },
    { from: "dx11-recursion", to: "mv-pump" },
    { from: "dx11-assert", to: "mv-pump" },
    { from: "dx12-black", to: "mv-pump" },
    { from: "mv-pump", to: "mouse-locked" },
    { from: "mv-pump", to: "kb-never-reaches" },
    { from: "mv-topmost", to: "z-order-regression" },
  ],

  // ───────────── Scripts audit table. ─────────────
  scripts: {
    summary: { pass: 20, rewritten: 2, new: 1 },
    summaryTiles: [
      { num: 20, label: "pass · unchanged",  cls: "pass" },
      { num: 2,  label: "rewritten",         cls: "rewritten" },
      { num: 1,  label: "new",               cls: "new" },
    ],
    rows: [
      { file: "Tests/tarrayfname.lua", date: "2026-05-25", status: "rewritten", notes: "Old version had nested-end typo, no Mesh/RootComponent fallback, no error isolation. Caches FName userdata + narrow strings; on_frame just draws cached values." },
      { file: "Tests/grok.lua", date: "2026-05-25", status: "rewritten", notes: 'Removed require("API_Mod_Lua") + Kismet deps. Fixed Matrix4x4f.indentity() typo. Wrapped every panel in pcall. Removed ~200 lines of dead code.' },
      { file: "Tests/new_api_panels.lua", date: "2026-05-25", status: "new", notes: "Comprehensive interactive checklist: Vector/Quat/Matrix/Transform, TArray<FName>, TArray<UObject*>, StructObject r/w, worker benchmark, function caller, fast-path transform benchmark." },
      { file: "API_Main.lua", date: "2026-05-22", status: "pass", notes: "Heavy use of find_uobject, get_objects_matching, get_full_name, get_fname, pcall — all unchanged." },
      { file: "BoneUtil.lua", date: "2026-05-25", status: "pass", notes: "Uses GetSocketTransform, K2_GetComponentTransform via standard reflection." },
      { file: "CameraManager.lua", date: "2026-05-18", status: "pass" },
      { file: "Hit.lua", date: "2026-05-18", status: "pass", notes: "Uses process_event/call_function on LineTraceSingleByChannel." },
      { file: "NewEnvdump.lua", date: "2026-05-18", status: "pass", notes: "No UEVR API usage." },
      { file: "APIUE.lua", date: "2026-05-11", status: "pass", notes: "Standard reflection chain. Now also has a faster alternative — see fast-path migration." },
      { file: "Main.lua", date: "2026-05-08", status: "pass" },
      { file: "Inputs.lua", date: "2026-05-04", status: "pass" },
      { file: "Colors.lua", date: "2026-05-04", status: "pass" },
      { file: "API_Mod_GLM.lua", date: "2026-05-02", status: "pass", notes: "Vector/Quat/Matrix metamethods are a strict superset of what API_Mod_GLM relies on." },
      { file: "API_Mod_Lua.lua", date: "2026-05-01", status: "pass" },
      { file: "ImGui.lua", date: "2026-04-29", status: "pass" },
      { file: "API_Mod_ImGui.lua", date: "2026-04-26", status: "pass", notes: "Deduplicated bindings::open_imgui keeps original 207 entries." },
      { file: "API_Mod_VR.lua", date: "2026-04-21", status: "pass" },
      { file: "Panels.lua", date: "2026-04-21", status: "pass" },
      { file: "inspect.lua", date: "2026-04-21", status: "pass" },
      { file: "class.lua", date: "2026-04-21", status: "pass" },
      { file: "API_Mod_Draw.lua", date: "2026-04-14", status: "pass" },
      { file: "Examples/Pong.lua", date: "—", status: "pass", notes: "Spot-checked." },
      { file: "Examples/MaterialMenu.lua", date: "—", status: "pass", notes: "Spot-checked." },
    ],
  },

  // ───────────── Files touched on this branch. ─────────────
  files: [
    {
      path: "src/Framework.cpp",
      domain: "core",
      changeCount: 4,
      changes: [
        "IMGUICONFIGFLAGS macro: viewports flag toggle",
        "on_frame_d3d11 / on_frame_d3d12: present-thread gating",
        "pump_secondary_viewport_messages() helper",
        "Recursion guard (thread_local s_in_d3d11_frame / s_in_d3d12_frame)",
      ],
    },
    {
      path: "src/uevr-imgui/imgui_impl_win32.cpp",
      domain: "imgui",
      changeCount: 2,
      changes: [
        "ImGui_ImplWin32_CreateWindow — WndProc routing audit pending",
        "GetWin32StyleFromViewportFlags — unconditional WS_EX_TOPMOST",
      ],
    },
    {
      path: "src/uevr-imgui/imgui_impl_dx11.cpp",
      domain: "imgui",
      changeCount: 2,
      changes: [
        "Swap-chain template installed in Init",
        "memcpy size fix in SetSwapChainDescs",
      ],
    },
    {
      path: "src/uevr-imgui/imgui_impl_dx12.cpp",
      domain: "imgui",
      changeCount: 1,
      changes: ["RSSetViewports(3 → 1) for secondary windows"],
    },
    {
      path: "src/mods/uobjecthook/UObjectHook.cpp",
      domain: "ui",
      changeCount: 5,
      changes: [
        "Live Function Caller pinned panel + 4 slots",
        "Drag-and-drop sources on every TreeNode",
        "Function-call editor full rewrite",
        "Return-value pretty-printing",
        "Missing-TreePop hardening (find() + ScopeGuard)",
      ],
    },
    {
      path: "lua-api/api/api_fast.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["uevr.api_fast namespace — direct SDK accessors"],
    },
    {
      path: "lua-api/api/workers.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["Multistate workers + shared map + log channel"],
    },
    {
      path: "lua-api/api/tarray.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["TArray<T> primitive/FName/FString/Object*/Struct read paths"],
    },
    {
      path: "lua-api/api/glm_bindings.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["GLM Vec/Quat/Mat/Transform full rewrite"],
    },
    {
      path: "lua-api/api/imgui_bindings.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["open_imgui dedup 498 → 207 + new bindings"],
    },
    {
      path: "lua-api/api/midhooks.cpp",
      domain: "lua-api",
      changeCount: 1,
      changes: ["uevr.hook_create_mid + uevr.call_function (asmjit stub)"],
    },
  ],

  // ───────────── Side-tasks ──
  sideTasks: [
    {
      id: "side-uevrlib",
      num: "01",
      title: "Strip + rework jbusfield/uevrlib",
      kind: "rework",
      upstream: "github.com/jbusfield/uevrlib",
      summary: "~28K-line pure-Lua helper library plus a small tarray_helper.dll. Roughly half duplicates what luavrlib now exposes natively. The other half is real VR feature code (attachments, IK, gunstock, reticule, etc.) worth keeping.",
      repoPath: "I:/code/lobotomy-x/uevrlib/",
      dependsOn: ["api-fast", "glm", "tarray", "workers"],
      status: "hand-off written · no code changes yet",
      lastUpdate: "2026-05-25",
      verdict: {
        keep: 18,    // attachments, ik, gunstock, etc.
        rewrite: 6,  // ui.lua, configui, controllers, reticule, scope, remap
        obsolete: 4, // math_lib, tarray, params, uevr_debug
        audit: 2,    // uevr_utils (4085 lines!), unit_test
      },
      modules: [
        { file: "uevr_utils.lua",            lines: 4085, verdict: "audit",    note: "Grab-bag; split into pieces" },
        { file: "remap.lua",                 lines: 2381, verdict: "rewrite",  note: "Controller remap; port to new ImGui surface" },
        { file: "scope.lua",                 lines: 1137, verdict: "rewrite",  note: "Weapon scope rendering" },
        { file: "reticule.lua",              lines:  993, verdict: "rewrite",  note: "Aim reticule" },
        { file: "uevr_dev.lua",              lines:  802, verdict: "obsolete", note: "Overlaps with Live Function Caller" },
        { file: "core/math_lib.lua",         lines:  775, verdict: "obsolete", note: "Replace with GLM bindings" },
        { file: "widget.lua",                lines:  562, verdict: "obsolete", note: "Overlaps with our ImGui bindings" },
        { file: "ui.lua",                    lines:  553, verdict: "rewrite",  note: "Dialog/menu handling" },
        { file: "core/params.lua",           lines:  379, verdict: "obsolete", note: "Use StructObject + function caller" },
        { file: "uevr_debug.lua",            lines:  358, verdict: "obsolete", note: "Replace with uevr.log_info/warn/error" },
        { file: "core/uevr_lib.lua",         lines:  129, verdict: "audit" },
        { file: "core/tarray.lua",           lines:  118, verdict: "obsolete", note: "Native TArray supersedes" },
        { file: "core/lerp.lua",             lines:  104, verdict: "keep",     note: "Pure math, no engine dep" },
        { file: "plugins/tarray_helper.dll", lines:  "—", verdict: "obsolete", note: "Entire DLL is obsolete on luavrlib" },
      ],
      actions: [
        { label: "Delete obsolete plumbing (tarray_helper.dll, math_lib.lua, uevr_debug)", status: "pending" },
        { label: "Port keepers module-by-module using api_fast + GLM + StructObject", status: "pending" },
        { label: "Re-do .luax examples as regression tests", status: "pending" },
        { label: "Update docs/ in lockstep with each port", status: "pending" },
        { label: "Drop reworked libs into user's Scripts/ folder", status: "pending" },
      ],
      acceptance: [
        "No remaining kismet_math_library:Vector_* fallback calls",
        "No remaining tarray_helper.dll references",
        "No remaining :K2_GetActorLocation in hot loops",
        "All logs route through uevr.log_info",
        "libs/ line count drops ≥30%",
      ],
    },
    {
      id: "side-mcp",
      num: "02",
      title: "Fork elliotttate/uevr-mcp, teach it our new APIs",
      kind: "fork",
      upstream: "github.com/elliotttate/uevr-mcp",
      summary: "C# .NET MCP server + C++ UEVR plugin. Both predate luavrlib. The fork's job: expose api_fast, multistate workers, the log channel, native TArray, the Live Function Caller and drag-drop sources to the AI agent.",
      repoPath: "I:/code/lobotomy-x/uevr-mcp/",
      dependsOn: ["api-fast", "workers", "tarray", "midhooks"],
      status: "hand-off written · not forked on GitHub yet",
      lastUpdate: "2026-05-25",
      newTools: [
        "uevr_call_fast(addr, \"actor_location_get\") — direct sdk::AActor accessor",
        "uevr_worker_spawn / uevr_worker_send / uevr_worker_stop",
        "uevr_set_shared / uevr_get_shared",
        "uevr_mid_hook_create / uevr_mid_hook_remove",
        "uevr_log_subscribe(severity_filter) — stream spdlog to AI",
      ],
      actions: [
        { label: "Snapshot upstream; fork on GitHub; set origin on local clone", status: "pending" },
        { label: "Build both pieces (mcp-server + plugin) with stock UEVR", status: "pending" },
        { label: "Plugin: add SDKFast bindings + worker routes + log-subscribe stream", status: "pending" },
        { label: "MCP server: add LuavrlibTools.cs + register in Program.cs + doc updates", status: "pending" },
        { label: "Migrate function_caller.cpp + property_reader.cpp to newer dispatcher", status: "pending" },
      ],
      acceptance: [
        "AI can call api_fast.get_actor_location via uevr_lua_exec",
        "AI can spawn worker, send benchmark, observe shared results",
        "uevr_invoke_method accepts Quat arg and writes K2_SetWorldTransform",
        "Log subscription delivers [lua] / [lua-worker] tagged lines",
      ],
    },
    {
      id: "side-reframework",
      num: "03",
      title: "REFramework cross-pollination",
      kind: "reference",
      upstream: "github.com/praydog/REFramework",
      summary: "REFramework has a more mature MCP / C# tooling stack. Use it as a reference for patterns to lift into our uevr-mcp fork. Reference task — not a port task.",
      repoPath: "(not cloned yet)",
      dependsOn: ["side-mcp"],
      status: "deferred · clone when work starts",
      lastUpdate: "2026-05-25",
      patternsToLift: [
        "C# MCP server naming + typed error response patterns",
        "Object / reflection inspection idioms (UE5 LWC float-vs-double in struct arrays)",
        "Lua sandboxing / hot-reload model",
        "CVar / console-variable surface as MCP tools",
      ],
      actions: [
        { label: "Clone REFramework alongside other sibling repos", status: "pending" },
        { label: "Browse tools/ or mcp/ — extract pattern checklist", status: "pending" },
        { label: "File issues in uevr-mcp fork for each pattern adopted", status: "pending" },
      ],
    },
  ],

  // ───────────── Roadmap milestones — date-sorted. ─────────────
  milestones: [
    { date: "2026-04-14", label: "API_Mod_Draw audit clean", kind: "audit" },
    { date: "2026-04-21", label: "API_Mod_VR / Panels audit clean", kind: "audit" },
    { date: "2026-04-26", label: "ImGui binding cleanup landed", kind: "ship", cardId: "imgui-cleanup" },
    { date: "2026-05-01", label: "Workers + shared map landed", kind: "ship", cardId: "workers" },
    { date: "2026-05-02", label: "GLM rewrite landed", kind: "ship", cardId: "glm" },
    { date: "2026-05-08", label: "TArray read paths fixed", kind: "ship", cardId: "tarray" },
    { date: "2026-05-11", label: "uevr.api_fast shipped", kind: "ship", cardId: "api-fast" },
    { date: "2026-05-18", label: "UObjectHook menu rewrite", kind: "ship", cardId: "fn-editor" },
    { date: "2026-05-22", label: "Live Function Caller pinned", kind: "ship", cardId: "live-caller" },
    { date: "2026-05-25", label: "Multi-viewport re-enabled w/ candidate fixes", kind: "ship", cardId: "mv-pump" },
    { date: "2026-06-03", label: "Dockable Class Browser + Function Caller + text-input drop", kind: "ship", cardId: "class-browser" },
    { date: "2026-06-07", label: "Universal object picker + generic struct call params", kind: "ship", cardId: "struct-params" },
    { date: "2026-06-10", label: "Transform gizmo + dev sidebar + Lua IDE plugin v2", kind: "ship", cardId: "gizmo" },
    { date: "2026-06-11", label: "Lua crash hardening + C-API review consolidated", kind: "ship", cardId: "lua-crash-guard" },
    { date: "Jun 2026", label: "Reflection workbench complete — awaiting in-game verification", kind: "in-progress" },
    { date: "→ next", label: "Audit WndProc plumbing (Plan §1)", kind: "next" },
    { date: "→ next", label: "Smoke-test mouse routing (Plan §2)", kind: "next" },
    { date: "→ next", label: "Z-order restoration (Plan §3)", kind: "next" },
    { date: "→ next", label: "DX11 first-frame race (Plan §4)", kind: "next" },
  ],
};

// Backward-compat alias for the example project.
window.UEVR_DATA = window.PROGRESS_DATA;
