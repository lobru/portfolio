@echo off
setlocal EnableExtensions

REM ===========================================================
REM  Claude Design -> Repo deploy script
REM  Drag a .zip downloaded from Claude Design onto this file.
REM  Extracts, copies into the repo, commits, and pushes.
REM ===========================================================

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

cls
echo.
echo  ==================================================
echo    Claude Design - Drop to Deploy
echo  ==================================================
echo    Repo: %REPO%
echo.

if "%~1"=="" (
  echo    No zip dropped. Drag a .zip onto this script.
  echo.
  pause
  exit /b 1
)

if /i not "%~x1"==".zip" (
  echo    Not a .zip file: %~nx1
  echo.
  pause
  exit /b 1
)

set "ZIP=%~f1"

pushd "%REPO%"
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo    Not a git repository: %REPO%
  popd
  pause
  exit /b 1
)
popd

set "STAGE=%TEMP%\claude-design-%RANDOM%%RANDOM%"
mkdir "%STAGE%" 2>nul

echo    Extracting: %~nx1
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%STAGE%' -Force } catch { Write-Host ('    Error: ' + $_.Exception.Message); exit 1 }"
if errorlevel 1 (
  echo    Extraction failed.
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 1
)

REM If the zip has a single top-level folder, descend into it
set "SRC=%STAGE%"
for /f "delims=" %%A in ('powershell -NoProfile -Command "$i = Get-ChildItem -LiteralPath '%STAGE%'; if ($i.Count -eq 1 -and $i[0].PSIsContainer) { $i[0].FullName }"') do set "SRC=%%A"

echo.
echo    Files to deploy:
echo    ------------------------------------------------
pushd "%SRC%"
powershell -NoProfile -Command "Get-ChildItem -Recurse -File | ForEach-Object { '      ' + (Resolve-Path -Relative $_.FullName) }"
popd
echo.

set "CONFIRM="
set /p CONFIRM="    Copy to repo, commit, and push? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
  echo    Cancelled.
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 0
)

echo.
echo    Copying files into repo...
robocopy "%SRC%" "%REPO%" /E /XD .git node_modules /NFL /NDL /NJH /NJS /NC /NS >nul
if errorlevel 8 (
  echo    Copy failed.
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 1
)

pushd "%REPO%"

echo.
echo    Git status:
echo    ------------------------------------------------
git status --short
echo.

set "CHANGES=0"
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set "CHANGES=%%i"
if "%CHANGES%"=="0" (
  echo    No changes detected. Nothing to commit.
  popd
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 0
)

set "DEFMSG=update from claude design"
set "MSG="
set /p MSG="    Commit message [%DEFMSG%]: "
if "%MSG%"=="" set "MSG=%DEFMSG%"

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo    Commit failed.
  popd
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 1
)

echo.
echo    Pushing to origin...
git push
if errorlevel 1 (
  echo.
  echo    Push failed. Your commit is saved locally - run 'git push' to retry.
  popd
  rmdir /s /q "%STAGE%" 2>nul
  pause
  exit /b 1
)

popd
rmdir /s /q "%STAGE%" 2>nul

echo.
echo  ==================================================
echo    Done. Changes deployed and pushed.
echo  ==================================================
pause
