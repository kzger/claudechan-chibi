#!/usr/bin/env bash
# 安裝 / 更新 / 移除 Claude ちゃん終端機陪伴 mod（claudechan-chibi）— macOS / Linux / WSL / Git Bash
#
#   ./install.sh                 安裝或更新（user scope）
#   ./install.sh --scope project 只裝在目前專案
#   ./install.sh --uninstall     移除
set -euo pipefail

PLUGIN=claudechan-chibi
MARKET=chibi-local
SCOPE=user
UNINSTALL=0
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.claude/local-marketplaces/$PLUGIN"
OLD_PLUGIN=chibi-companion # the name before 0.4.0
OLD_DEST="$HOME/.claude/local-marketplaces/$OLD_PLUGIN"

while [ $# -gt 0 ]; do
  case "$1" in
    --uninstall) UNINSTALL=1 ;;
    --scope) SCOPE="$2"; shift ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "未知參數：$1" >&2; exit 2 ;;
  esac
  shift
done

run() { echo "  > claude $*"; claude "$@"; }

command -v claude >/dev/null 2>&1 || { echo "找不到 claude 指令。請先安裝 Claude Code：https://docs.claude.com/claude-code" >&2; exit 1; }

if [ "$UNINSTALL" = 1 ]; then
  echo "移除 $PLUGIN ..."
  run plugin uninstall "$PLUGIN@$MARKET" -s "$SCOPE" || true
  run plugin marketplace remove "$MARKET" || true
  rm -rf "$DEST"
  echo "完成。重新啟動 Claude Code 後生效。"
  exit 0
fi

# Before 0.4.0 the mod was named chibi-companion: take that install out first,
# and the marketplace that points at its folder.
if [ -d "$OLD_DEST" ] || claude plugin list 2>/dev/null | grep -q "$OLD_PLUGIN@$MARKET"; then
  echo "移除舊名稱 $OLD_PLUGIN ..."
  run plugin uninstall "$OLD_PLUGIN@$MARKET" -s "$SCOPE" || true
  if [ -d "$OLD_DEST" ]; then
    run plugin marketplace remove "$MARKET" || true
    rm -rf "$OLD_DEST"
  fi
fi

for need in .claude-plugin/marketplace.json plugin/.claude-plugin/plugin.json plugin/hooks/register.tsx plugin/hooks/frames-smooth.ts; do
  [ -e "$SRC/$need" ] || { echo "安裝包不完整：缺少 $need" >&2; exit 1; }
done

echo "複製檔案到 $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/.claude-plugin" "$SRC/plugin" "$DEST/"
for f in README.md README.zh-TW.md README.ja.md ATTRIBUTION.txt; do [ -e "$SRC/$f" ] && cp "$SRC/$f" "$DEST/"; done
rm -rf "$DEST/plugin/.claude-plugin/types"

echo "註冊本機 marketplace"
if claude plugin marketplace list 2>/dev/null | grep -q "$MARKET"; then
  run plugin marketplace update "$MARKET" || true
else
  run plugin marketplace add "$DEST"
fi

echo "安裝 $PLUGIN@$MARKET（scope: $SCOPE）"
if claude plugin list 2>/dev/null | grep -q "$PLUGIN@$MARKET"; then
  echo "  已安裝：檔案已更新，在 Claude Code 內執行 /reload-plugins 或重新啟動即可。"
else
  run plugin install "$PLUGIN@$MARKET" -s "$SCOPE"
fi

cat <<'EOF'

完成！啟動 claude 後：
  /chibi            查看目前設定
  /chibi auto       寬螢幕側面板、窄螢幕上方列（預設）
  /chibi set classic | smooth   切換圖庫
EOF
