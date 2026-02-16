# Kolmics (Keyboard Oriented Local coMICS viewer)

## Synopsis

Book reader/comic viewer optimized for keyboard and mouse operation based on LWMP with Neutralinojs

## Description

Kolmics is a dedicated book reader and manga viewer ported from the reader functionality of [localwebmediaplayer](https://github.com/reasonset/localwebmediaplayer) and rebuilt as a desktop application using [Neutralinojs](https://neutralino.js.org).

While transitioning to a desktop app, I added several specialized shortcuts for a streamlined reading experience. The application is written in clean Vanilla JavaScript with zero external dependencies (aside from Neutralinojs itself).

The shortcuts are heavily inspired by older versions of MComix. The motivation behind this project was to bring back the intuitive control scheme that was lost in newer iterations of other viewers.

## ✨ Key Features

* Pure Directory Focus: Displays images within a directory sorted by filename (lexicographical order).
* Smart Dual-Page View: Supports side-by-side spreads for portrait images.
* Manga Mode: Toggle page direction (Right-to-Left / Left-to-Right).
* Intelligent Layout: Automatically displays landscape images in single-page mode even when dual-page view is enabled.
* Precision Navigation: Support for "Step 1 page" even in dual-page view.
* Always Best-Fit: Images are automatically scaled to fit your window size.
* Optimized Controls: High-comfort navigation using both keyboard and mouse.

## 🚀 Installation

### General

Download the latest binary ZIP from the [Releases](https://github.com/reasonset/kolmics/releases) page and extract it to your preferred location (e.g., `~/.local/opt` on Linux). You can then execute the binary directly from the terminal.

### Linux

For a better desktop experience, use the resources in `install/linux`.

* `kolmics`: A wrapper command to be placed in your $PATH. (Default path: `$HOME/.local/opt/kolmics`)
* `kolmics.desktop`: Desktop entry for application association. Place in ~/.local/share/applications (user) or /usr/share/applications (system).
* `kolmics.nemo_action`: A right-click action for Nemo users. This allows you to open a directory directly from the context menu.
* `kolmics.svg`: The application icon.

You can use the provided `install.bash` to automate these steps.

Note: Linux installation resources are currently available in the repository itself, *not in the release ZIP.*

### Windows

Run `install.bat` included in the ZIP.

* This will register Kolmics to your **"Send to"** context menu.
* *Note: Please keep the `install.bat` in the same folder as the executable.*

## Usage

```
<kolmics_binary> <filepath>
```

`filepath` can be either a directory containing images or a single image file. If a file is specified, Kolmics will open the directory containing that file.

Note: Kolmics specifically supports single-level directories only. It does not support archive files (ZIP/CBZ), recursive subdirectories, PDFs, or ePubs.

Supported Formats: PNG, JPG, JPEG, WebP, and AVIF. Support depends on the underlying browser engine's `<img>` tag capabilities.

### ⌨️ Shortcuts

|Key|Action|
|-----|-------------|
|`↑` / `PageUp`|Previous page|
|`↓` / `PageDown`|	Next page|
|`←`|Move page Left|
|`→`|Move page Right|
|`Ctrl` + `PageUp`|Previous single page|
|`Ctrl` + `PageDown`|Next single page|
|`Home`|Go to First page|
|`End`|Go to Last page|
|`s` / `d`|Toggle Dual-page view|
|`r` / `m`|Toggle Manga mode (Reverse direction)|
|`F11` / `f`|Toggle Fullscreen|

### 🖱️ Mouse Controls

|Action|Result|
|-------|--------------------|
|Click Top|Area	Show Settings|
|Click Left Side|Move page Left
|Click Right Side|Move page Right|
|Click Center-Left|Move 1 page Left|
|Click Center-Right|Move 1 page Right|
|Wheel Up|Previous page|
|Wheel Down|Next page|
