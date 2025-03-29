# GameBar Overlay

A fullscreen overlay widget for GNOME that displays useful information, audio controls and more.

> [!WARNING]
> This extension has been developed for GNOME 46, 47 and 48, although it is possible to install it on other GNOME versions, please note that you do so at your own risk.

## Features

- Fullscreen overlay for quick access to essential information
- Audio controls integration
- CPU usage and temperature monitor

## Installation

Just clone the repo into `~/.local/share/gnome-shell/extensions/gamebar-overlay@dekotale.github.io` and enable the extension via GNOME Extensions app or similar.

## Usage

Open the Overlay by clicking the top-bar button or by pressing `Super + G`

## Functionalities and addons

- [x] Show actual time
- [x] Volume control
- [x] Make configuration of the extension
- [x] CPU usage and temperature addon
- [ ] GPU usage and temperature addon
- [ ] Screenshot addon
- [ ] Weather addon
- [ ] Battery addon
- [ ] Brightness addon

## Known issues

- When change the primary monitor to a diferent resolution monitor, the overlay size do not update properly until GNOME reboots.
- The width of the clock addon's container slightly changes size when the text displaying the time changes.
- The extension closes if you click on the clock addon with the 'Close on Empty Area Click' option enabled.
- Minor visual glitches may occur during the exit animation if the empty area is clicked repeatedly and rapidly while "Exit on Empty Area Click" is enabled. This is due to overlapping animation triggers.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Translations

1. Copy `po/gamebar-overlay@dekotale.github.io.pot` into the new `.po` translation file. Example: `en.po`
2. Use a po editor software or text editor to translate all the strings into the new language.
3. Compile the Translation (MO file):  You need to compile your `.po` file into a binary `.mo` file.  You *can* do this using the `gnome-extensions` tool, but it's **much easier** with a PO editor, which usually has a "Compile to MO" option.  If you *must* use the command line, do the following:
    * Run: `gnome-extensions pack --podir=po gamebar-overlay@dekotale.github.io`
    * This creates a `.zip` file.  Extract the `locale` folder from the `.zip`.
    * Merge the extracted `locale` folder with the `locale` folder in your *local copy* of the extension's repository.  Ensure the new language directory (e.g., `locale/es/LC_MESSAGES/`) and the `.mo` file (e.g., `locale/es/LC_MESSAGES/gamebar-overlay@dekotale.github.io.mo`) are in the correct place.  *Make sure the directory structure is correct.*
4. Create a branch called: `translation_{language}`, add the files and do the commits.
5. Submit the pull request and await approval.


## License

This project is licensed under the [MIT License](LICENSE).
