@echo off
set FILE=../frontend/src/assets/bidarbak-logo.svg
set OUT=../frontend/src/assets/icons
set ASSETS=../frontend/src/assets
set WEBSITE=../website
set RESOURCES=../frontend/resources

for %%S in (16 32 48 64 72 96 128 144 192 256 512 1024) do (
  inkscape "%FILE%" --export-type=png --export-width=%%S --export-filename="%OUT%/icon-%%S.png"
  magick "%OUT%\icon-%%S.png" -quality 85 "%OUT%\icon-%%S.webp"
)


REM ===== Reuse existing exports =====

REM favicon (use 32px)
copy /Y "%OUT%\icon-32.png" "%ASSETS%\icon\favicon.png"

REM Android launcher (use 512px)
copy /Y "%OUT%\icon-512.png" "%ASSETS%\ic_launcher.png"

REM Android round (same image, system will mask it)
copy /Y "%OUT%\icon-512.png" "%ASSETS%\ic_launcher_round.png"

REM Android round (same image, system will mask it)
copy /Y "%OUT%\icon-512.png" "%WEBSITE%\ic_launcher_round.png"

REM Android round (same image, system will mask it)
copy /Y "%OUT%\icon-512.png" "%RESOURCES%\icon.png"

echo Done!
pause