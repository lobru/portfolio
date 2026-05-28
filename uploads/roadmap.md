# Editor roadmap

Bugs are fixed first, then features in priority order. Each item is sized so a
single iteration can land it; bigger items have explicit substeps.

## ✅ Just fixed (2026-05-11, round 3) — feature batch
- [x] **DLL packaging** — `option(TEXTEDITOR_BUILD_SHARED)` builds
      `TextEditorLib` as a DLL (`WINDOWS_EXPORT_ALL_SYMBOLS`); without it
      it's a static lib linked into `example`. `build.ps1 -Shared` flips it.
      The editor source no longer needs annotations.
- [x] **Runtime language definitions** — `Language::FromFile(path)` parses a
      simple `key=value` text format (lines starting with `#`/`;` are
      comments). Recognised keys cover the common Language fields plus
      `extensions=` for path routing. Cache is process-lifetime so pointers
      stay stable. Six starter language files shipped in
      `example/languages/`: HTML, INI, YAML, CFG, BAT, PowerShell.
      `Editor::loadRuntimeLanguages()` walks that directory at startup and
      registers each `.lang` file's declared extensions, so
      `languageForPath` picks them up after the built-ins.
- [x] **File-dialog favourites + drives sidebar** — switched to ImGuiFileDialog's
      native Places feature (needed `USE_PLACES_FEATURE` + `PLACES_PANE_DEFAULT_SHOWN`
      in `IgfdConfig.h`). Two groups registered once on first open:
      *Drives* (Windows: enumerated via `GetLogicalDriveStringsW`; POSIX: `/`
      and `$HOME`) and *Favourites* (loaded from `.claude/favorites.txt`,
      user-editable in-dialog because the group is created with `canEdit=true`).
- [x] **Script runner** — F5 saves the active doc, picks an interpreter from
      its extension (`.py` → python, `.ps1` → PowerShell, `.bat`/`.cmd` → cmd,
      `.sh` → bash, `.lua` → lua, `.js` → node), runs it synchronously with
      stderr merged, and dumps the output into a dockable "Output" window.
      View menu has a checkbox to show/hide it.

## ✅ Just fixed (2026-05-11, round 2)
- [x] **`///` / `//` docstring fold** — `rebuildFoldRanges` now tracks runs of
      consecutive lines whose first non-whitespace token is the language's
      single-line-comment marker (`singleLineComment`/`singleLineCommentAlt`).
      Runs of ≥ 3 lines become a `Comment` fold with the `" /*...*/"` preview.
      Works for any language that defines a single-line comment string.
- [x] **Header / Source toggle (Alt+O)** — `Editor::toggleHeaderSource`.
      Cycles through candidate sibling extensions (`.h/.hpp/.hxx/.hh` ↔
      `.cpp/.cc/.cxx/.c/.m/.mm/.inl`). Re-uses an already-open tab if found,
      otherwise opens the file from disk. Menu item under File too.
- [x] **`#include` → Go to file** — context-menu hook detects `#include`,
      `import`, or `from` lines that quote/angle-bracket a path, resolves it
      relative to the current document's directory, and adds a "Go to File"
      entry when the target exists.

## ✅ Just fixed (2026-05-11)
- [x] **Scroll-to-bottom on fold-preview click** — root cause was
      `lineToVisualIndex` returning `total visible count` for a hidden line.
      With indent folds, `fr.end.line` IS hidden, so the cursor-end's VI was
      ≈ total lines → `makeCursorVisible` scrolled to EOF. Fixed by snapping
      to the VI of the nearest visible line at-or-before the target.
- [x] **`deindentLines` over-processes the trailing line** when a multi-line
      selection ends at column 0. Now the loop's `lastLine` stops at the
      previous line in that case (matches what `indentLines` already did).
- [x] **File dialog snapped back to the original viewport every frame** —
      `SetNextWindowViewport` was being called unconditionally. Now gated on
      a `dialogNeedsPlacement` flag set in `show*` and cleared on first
      render, so once the user docks the dialog into another viewport it
      stays there.
- [x] **Subword params unified** — macOS branch previously did
      `moveLeft(shift, alt)` (alt-as-wordMode); now both platforms call
      `moveLeft/moveRight(select, wordMode, subWord)` with Ctrl/Cmd = word,
      Alt = subword. Same signature, same semantics, no more drift.
- [x] **Click-and-drag for selected text** finished: mousedown on an
      existing selection now caches the text + range; release at a valid
      drop point moves it (plain) or copies it (Ctrl). Drops inside the
      source range are rejected. Done as a single transaction so undo
      restores both endpoints.
- [x] **Chord shortcut queue** wired up. Press Ctrl+K with nothing pending
      to open a prefix; the next key (with Ctrl still held) finishes the
      chord. Built-in chords:
      `Ctrl+K  Ctrl+U` → uppercase selection,
      `Ctrl+K  Ctrl+L` → lowercase selection,
      `Ctrl+K  Ctrl+0` → fold all,
      `Ctrl+K  Ctrl+J` → unfold all.
      Releasing Ctrl or pressing Esc cancels.
- [x] **SDL3 drop event API** — `SDL_DROPFILE` / `event.drop.file` were the
      SDL2 names; SDL3 uses `SDL_EVENT_DROP_FILE` / `event.drop.data`. Build
      now compiles after the rename.

## ✅ Just fixed (2026-05-10, round 2)
- [x] Click Y double-scroll: `mousePos.y` already content-relative; dropped the
      stray `+ GetScrollY()` that was making clicks miss after scrolling.
- [x] Python indent folding: rewritten so a block opens only when indent
      strictly increases, ends when it decreases. No more spurious one-line
      folds on every top-level statement.
- [x] `updateVisibility`: `Indent` folds now hide `[start+1, end]` inclusive
      (body's last line was leaking).
- [x] Fold preview indicator per fold type: `Indent → " ..."`, `Comment → " /*...*/"`,
      `IfDef → " #if..."`, `Region/PragmaRegion → " //..."`, `Braces → " {...}"`.
      Python no longer shows `{...}`.
- [x] Fold arrow visual: AA-friendly triangles sized to the font, nudged right
      so they don't kiss the line-number gutter, double-click on the arrow
      selects the entire fold range.
- [x] Click-on-fold-preview selects the fold range; double-click also unfolds.
- [x] Ctrl+Shift+T reopens the last closed tab (32-deep stack), menu item under
      File. Empty untitled tabs are not pushed.
- [x] File dialog is no longer modal and no longer pinned to the main viewport
      centre. Sized + positioned with `ImGuiCond_FirstUseEver` so it stays
      where the user drags/resizes it. Drag it out and it becomes its own
      OS window via multi-viewport.

## ✅ Earlier (2026-05-10, round 1)
- [x] Tab → Shift+Tab now round-trips (manual `cursor->adjustForDelete` in `deindentLines`).
- [x] All modal/file dialogs now open on the focused viewport (capture
      `GetWindowViewport()->ID` on `show*` and use `SetNextWindowViewport` on render).
- [x] Editing inside a folded region auto-unfolds it
      (`Folder::unfoldContaining` called from `insertText` / `deleteText`).

## Pending bug fixes / polish

- [ ] **Cursor X mis-alignment** still reported after the Y double-scroll fix.
      Reproduce: open `.md` with tabs, click in middle of a long line —
      cursor lands past end. Suspect either `glyphSize.x` (from
      `CalcTextSize("#")` before font push?) doesn't match the editor's
      actual glyph width, or `normalizeCoordinate` is jumping a tab when it
      shouldn't. Add an `assert(column == cursor.column after roundtrip)` to
      narrow it down.
- [ ] **Fold preview drawn on its own row** in some cases. Worth retesting
      after the Python indent-fold rewrite landed — image 1's "extra row"
      may have been one of the spurious top-level indent folds that no
      longer exists.
- [ ] **`///` docstring folds** — detect runs of ≥ 3 consecutive lines whose
      first non-whitespace tokens are `///` and emit a `Comment` fold with
      preview `" ///..."`. Wire into `rebuildFoldRanges` alongside the
      existing `/* */` handling.

## Feature backlog

### High priority

- [ ] **Fold all / Unfold all**
  - Hotkey: `Ctrl+K Ctrl+0` and `Ctrl+K Ctrl+J` (VSCode-style) plus a View-menu
    item so it's discoverable.
  - Implement `Folder::foldAll(Document&)` / `unfoldAll(Document&)` that flips
    every `fr.folded` and calls `updateVisibility`.
  - Wire into `renderMenuBar` + the keyboard handler in `handleKeyboardInputs`.

- [ ] **Header / source toggle (Alt+O)**
  - When current doc is `.h/.hpp/.hxx`, look for a sibling `.c/.cpp/.cc/.cxx`
    in the same directory; if open, focus its tab; else open it.
  - Symmetric for `.cpp` → `.h` etc. Use `languageForPath`'s extension list as
    the source of truth  for what counts as "source" vs "header".
  - New `Editor::toggleHeaderSource()` triggered from `Alt+O` keyboard branch.

- [ ] **Runtime language definitions**
  - File format: TOML or JSON describing keywords, comment markers, brackets,
    string delimiters, indentation rules. Drop the sample format in
    `example/languages/*.json` and load all of them at startup.
  - `TextEditor::Language::FromFile(path)` factory — constructs a `Language`
    from the JSON; register it so `GetLanguageName()` and the status-bar combo
    pick it up.
  - First batch ship with built-in JSON files: **html, ini, yaml, cfg, bat, ps1**.
    (Rendering them only needs keyword lists + comment markers; folding falls
    back to braces/indent automatically.)

- [ ] **DLL packaging**
  - New `CMakeLists.txt` target `TextEditor` (SHARED) exporting `TextEditor`
    + `TextDiff` + `Trie`. `__declspec(dllexport)` macro `TEXTEDITOR_API`.
  - Use `CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS` for the first cut to avoid annotating
    every public method; tighten later.
  - `example` continues to link statically — keep both options via
    `option(TEXTEDITOR_BUILD_SHARED)`.

### Medium priority

- [ ] **Word-based context menu hooks**
  - The `SetTextContextMenuCallback` already gets `(line, column)`. Extend
    `TextEditor` with `GetWordAt(line, column)` (returns the word + a
    `Coordinate` range) — likely already half-implemented via `findWordStart`/
    `findWordEnd`.
  - **Jump to definition (best-effort)**: scan the document for the first
    occurrence of `TYPENAME word`, `word(`, or `define word` and jump to it.
    Fast lexical heuristic — no real parser. Show "No definition found"
    otherwise.
  - **Go to file on `#include`**: detect `#include "x"` / `<x>` on the cursor
    line; resolve relative to the document path, then check `IncludePaths`
    member (configurable). Open in a new tab if found.

### Low priority

- [ ] **File dialog favorites + drive sidebar**
  - ImGuiFileDialog supports custom side-panes via `IGFD::FileDialogConfig::sidePane`.
    Render a sidebar that lists `GetLogicalDriveStringsW` results plus a user-
    editable favorites file (`.claude/favorites.txt`).

- [ ] **Script runner**
  - Right-click → Run File (or `F5`) in py/.sh/.ps1 docs. Spawn the interpreter
    with the file path; capture stdout/stderr to a docked "Output" window.
  - Per-language config (interpreter + args) in a small JSON, default sane
    values (`python`, `pwsh -File`, `bash`).

- [ ] **`#include` "Go to File"** — see above; can ship as the minimum useful
  bit of the medium-priority context-menu work.

## Process notes

- Project is `/W4 /WX` MSVC. Watch out for: `int → float` narrowing,
  signed/unsigned compares, unused params/locals.
- After ImGui dep changes, run `.\build -Clean` once; otherwise incremental
  rebuilds are fine.
- The Windows v1.92.7-docking branch of Dear ImGui is in use; multiviewport is
  enabled, so any popup must be routed through `SetNextWindowViewport` if we
  want it to land on the right monitor.
