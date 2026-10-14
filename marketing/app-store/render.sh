#!/bin/zsh
# Renders every scene in scenes.html to an exact-size PNG for App Store Connect.
#   ./render.sh            (needs Playwright's headless Chromium: npx playwright install chromium-headless-shell)
set -e
cd "$(dirname "$0")"
CHROME=$(find ~/Library/Caches/ms-playwright -name chrome-headless-shell -type f | head -1)
mkdir -p out
render() { # name width height
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=$2,$3 --virtual-time-budget=8000 --allow-file-access-from-files \
    --screenshot="out/$1.png" "file://$PWD/scenes.html?s=$1" 2>/dev/null
  echo "$1  $(sips -g pixelWidth -g pixelHeight out/$1.png | awk '/pixel/{printf "%s ", $2}')"
}
for i in 1 2 3 4 5 6 7 8 9 10; do render s$i 1206 2622; done
render header 3840 1646
render search 3840 2560
