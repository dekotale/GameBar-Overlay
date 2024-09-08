# GameBar Overlay

A fullscreen overlay widget for GNOME that displays useful information, audio controls and more.

> [!WARNING]
> This extension has been developed for GNOME 46, although it is possible to install it on other GNOME versions, please note that you do so at your own risk.

## Features

- Fullscreen overlay for quick access to essential information
- Audio controls integration

## Installation

Just clone the repo into `~/.local/share/gnome-shell/extensions/gamebar-overlay@dekotale.github.io` and enable the extension via GNOME Extensions app or similar.

## Usage

Open the Overlay by clicking the top-bar button or by pressing `Super + G`

## Functionalities and addons

- [x] Show actual time
- [x] Volume control
- [x] Make configuration of the extension
- [ ] Screenshot addon
- [ ] Weather addon
- [ ] Battery addon
- [ ] Brightness addon
- [ ] CPU and GPU usage and temperature addon

## Known issues

- When change the primary monitor to a diferent resolution monitor, the overlay size do not update properly until GNOME reboots.
- The width of the clock addon's container slightly changes size when the text displaying the time changes.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).
