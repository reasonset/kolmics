#!/bin/bash

_dir="$(dirname "$(readlink -f "$0")")"
share_dir="${XDG_DATA_HOME:-$HOME/.local/share}"

install -D -m 755 "$_dir/kolmics" "$HOME/.local/bin/kolmics"
install -D -m 644 "$_dir/kolmics.svg" "$share_dir/icons/hicolor/scalable/apps/kolmics.svg"
install -D -m 644 "$_dir/kolmics.desktop" "$share_dir/applications/kolmics.desktop"
install -D -m 644 "$_dir/kolmics.nemo_action" "$share_dir/nemo/actions/kolmics.nemo_action"

if command -v gtk-update-icon-cache > /dev/null 2>&1
then
  gtk-update-icon-cache -f -t "$share_dir/icons/hicolor"
fi

if command -v update-desktop-database > /dev/null 2>&1
then
  update-desktop-database "$share_dir/applications"
fi

if command -v xdg-desktop-menu > /dev/null 2>&1
then
  xdg-desktop-menu forceupdate
fi

echo "Done. 'kolmics' has been installed."
