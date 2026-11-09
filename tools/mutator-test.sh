#!/bin/sh
# The plugin tests, run the way `mutator --test-command` needs them.
# A mutator worker is a symlink overlay, and `claude plugin test` does not
# follow symlinked folders: copy the real files (links followed) to a temp
# folder, keep the big assets as one link, and test that copy.
set -e
run="$(mktemp -d)"
trap 'rm -rf "$run"' EXIT
rsync -aL --exclude assets --exclude .DS_Store plugin/ "$run/plugin/"
ln -s "$(cd plugin/assets && pwd -P)" "$run/plugin/assets"
claude plugin test "$run/plugin"
