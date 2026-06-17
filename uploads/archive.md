# Archive

## Week of 2026-05-26

Shipped ImGuiColorTextEdit sprint (fold+preview, multi-tab dock, langs, file-dialog, F5, nav-tree, go-def, toolchain-detect, img-viewer, recycle-bin). Resolved perf bottlenecks (shared-trie hangs, pan/fold latency, menu stutter via memoization). Fixed C# scope bug, console hide (/SUBSYSTEM:WINDOWS). Build green; pending: platform-audit, py-venv, word-wrap, lua-fold, md-preview.

## Week of 2026-06-02

Shipped perf sprint: eliminated shared-trie bottlenecks via O(1) visual-idx, completed keybind system with two-stroke chords + persistent app-level registry. Multi-lang nav: XAMLÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬ "C# goto, Lua folding, C# decompiler (ilspy autoinstall, type-forward resolve). UI polish: image nav-preview, line-highlight on goto/find, proportional text per-glyph. Roadmap pivot: emscripten + embeddable DLL; 40+ commits; verification debt resolved.
```