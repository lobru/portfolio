//	TextEditor - A syntax highlighting text editor for ImGui
//	Copyright (c) 2024-2026 Johan A. Goossens. All rights reserved.
//
//	This work is licensed under the terms of the MIT license.
//	For a copy, see <https://opensource.org/licenses/MIT>.


#pragma once


//
//	Include files
//

#include <algorithm>
#include <functional>
#include <memory>
#include <string>
#include <atomic>
#include <mutex>
#include <unordered_map>
#include <vector>
#include <imgui.h>
#include "../TextEditor.h"
#include "../TextDiff.h"


//
//	Editor
//

class Editor {
	public:
	// constructor
	Editor();

	// file related functions
	void newFile();
	void newFile(std::string& path);

	void openFile();
		void openFile(const std::string& path);
	void saveFile();
	void saveFile(std::string& path);


	// manage program exit
	void tryToQuit();
	inline bool isDone() const { return done; }

	// render the editor
	void render();

	private:
	// per-document state — each doc is its own dockable window
	struct TabDocument {
		TextEditor editor;
		TextDiff   diff;
		std::string filename    = "untitled";
		std::string originalText;
		size_t      version     = 0;
		size_t      id          = 0;       // stable id for window labels
		bool        open        = true;    // window open flag
		bool        wantFocus   = false;   // request focus next frame
		bool        wantSplit   = false;   // dock as a split next to the active doc
		TextEditor::Trie trie;
	};

	// document management — stored as unique_ptr so addresses remain stable
	std::vector<std::unique_ptr<TabDocument>> tabs;
	size_t activeTab = 0;
	size_t nextId    = 1;

	// "Reopen closed tab" stack — keeps the last few closed tabs' filenames+text
	struct ClosedTab { std::string filename; std::string text; };
	std::vector<ClosedTab> recentlyClosed;

	void reopenLastClosedTab();

	// Alt+O: switch between the .h/.hpp/.hxx file and its sibling .c/.cpp/.cc/.cxx
	// (or vice versa). Re-uses an already-open tab when found.
	void toggleHeaderSource();

	inline TabDocument& doc()             { return *tabs[activeTab]; }
	inline const TabDocument& doc() const { return *tabs[activeTab]; }

	bool isDirtyTab(size_t i) const { return tabs[i]->editor.GetUndoIndex() != tabs[i]->version; }
	inline bool isDirty()   const { return isDirtyTab(activeTab); }
	inline bool isSavable() const { return isDirty() && doc().filename != "untitled"; }

	// private functions
	void renderMenuBar();
	void renderStatusBar();
	void renderDockedDocuments();
	void renderDocumentWindow(TabDocument& t);

	// index = -1  → append at end
	// split = true → request the new doc be docked next to the active one
	TabDocument& newTab(const std::string& path, bool split = false, int index = -1);
	TabDocument& newTab();
	
	void closeTab(size_t idx);
	std::string windowLabelFor(const TabDocument& t) const;

	void showDiff();
	void showFileOpen();
	void showSaveFileAs();
	void showConfirmClose(std::function<void()> callback);
	void showConfirmQuit();
	void showError(const std::string& message);

	void renderDiff();
	void renderFileOpen();
	void renderSaveAs();
	void renderConfirmClose();
	void renderConfirmQuit();
	void renderConfirmError();

	void setAutocompleteMode(bool flag);
	void buildAutocompleteTrie(TabDocument& t);

	static const TextEditor::Language* languageForPath(const std::string& path);

	// Languages discovered at startup from `./languages/*.lang` (or relative to
	// the executable). Indexed by lowercase extension, e.g. ".html" → HTML.
	static std::unordered_map<std::string, const TextEditor::Language*>& runtimeLanguagesByExt();
	static void loadRuntimeLanguages();
	static void runScriptForActiveDoc();  // F5 in script-runner

	// application state
	bool done = false;
	std::string errorMessage;
	std::function<void()> onConfirmClose;

	// remember which viewport was focused when a modal/file dialog was opened
	// so we can place the popup on that viewport (matters with multi-viewport).
	// `dialogNeedsPlacement` is set on open and cleared after one render so the
	// dialog isn't snapped back to the original viewport every frame.
	unsigned int dialogViewportId    = 0;
	bool         dialogNeedsPlacement = false;
	float fontSize = 17.0f;
	inline void increaseFontSIze() { fontSize = std::clamp(fontSize + 1.0f, 8.0f, 24.0f); }
	inline void decreaseFontSIze() { fontSize = std::clamp(fontSize - 1.0f, 8.0f, 24.0f); }

	bool autocomplete = false;

	// Script runner state — F5 spawns the interpreter for the current document
	// in a background thread and streams stdout/stderr into a docked "Output"
	// window. The thread is detached; concurrent access to `scriptOutput` is
	// gated by `scriptOutputMutex`. `scriptGen` lets newer runs invalidate
	// any older threads still finishing up.
	bool                                 scriptOutputVisible = false;
	std::string                          scriptOutput;
	std::mutex                           scriptOutputMutex;
	std::atomic<bool>                    scriptRunning{false};
	std::atomic<int>                     scriptGen{0};
	void renderScriptOutputWindow();
	void runScriptForDoc();
	// F6: walk up from the active doc to find a project build script
	// (build.bat / build.ps1 / build.sh / Makefile / CMakeLists.txt) and run it.
	void runProjectBuild();

	enum class State {
		edit,
		diff,
		newFile,
		openFile,
		saveFileAs,
		confirmClose,
		confirmQuit,
		confirmError
	} state = State::edit;
};
