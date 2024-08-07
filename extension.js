import GObject from 'gi://GObject';
import St from 'gi://St';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// Import addons TODO:: make addons configurable
import {Clock} from './addons/clock.js';
import {CloseButton} from './addons/closeButton.js';
import {SoundControls} from './addons/soundControls.js';
//TODO:: screenshot addon
//TODO:: weather addon
//TODO:: battery addon
//TODO:: brightness addon
//TODO:: cpu and gpu usage and temperature addon

const GameBar = GObject.registerClass(
class GameBar extends PanelMenu.Button {
    /**
     * Initializes a new instance of the GameBar class.
     * This constructor is called when a new instance of the class is created.
     * It initializes the properties and calls the necessary methods to set up the GameBar panel button.
     */
    _init() {
        // Call the parent class's _init method to initialize the instance
        super._init(0.0, 'GameBar');

        // Create a new St.Icon widget with the input-gaming-symbolic icon and add it as a child to the GameBar panel button
        this._icon = new St.Icon({
            icon_name: 'input-gaming-symbolic', // Set the icon name to 'input-gaming-symbolic'
            style_class: 'system-status-icon' // Add the 'system-status-icon' style class to the icon
        });
        this.add_child(this._icon);

        // Call the _createOverlay method to create the overlay widget and addons
        this._createOverlay();

        // Connect the 'button-press-event' signal of the GameBar panel button to the _toggleOverlay method
        this.connect('button-press-event', this._toggleOverlay.bind(this));
    }

    /**
     * Creates the overlay widget and adds instances of addons.
     * The overlay widget is positioned and sized to cover the primary monitor.
     * The addons are instantiated with the overlay widget and the primary monitor.
     * The overlay widget is added to the layout manager to affect the input region.
     */
    _createOverlay() {
        // Get the primary monitor
        let primaryMonitor = Main.layoutManager.primaryMonitor;

        // Create the overlay widget
        this._overlay = new St.Widget({
            style_class: 'gamebar-overlay', // CSS class for styling
            reactive: true, // Enable reactive handling of events
            can_focus: true, // Enable focus handling
            x_expand: true, // Expand horizontally to fill the width of the parent
            y_expand: true, // Expand vertically to fill the height of the parent
            visible: false // Start hidden
        });

        // Set the size of the overlay widget to match the primary monitor
        this._overlay.set_style(`width: ${primaryMonitor.width}px; height: ${primaryMonitor.height}px;`);

        // Create instances of addons and pass the overlay widget and the primary monitor
        this._clock = new Clock(this._overlay, primaryMonitor); // Clock addon
        this._closeButton = new CloseButton(this._overlay, primaryMonitor); // Close button addon
        this._soundControls = new SoundControls(this._overlay, primaryMonitor); // Sound controls addon

        // Add the overlay widget to the layout manager to affect the input region
        Main.layoutManager.addChrome(this._overlay, { affectsInputRegion: true });
    }

    /**
     * Toggles the visibility of the overlay widget.
     * If the overlay is visible, it is hidden.
     * If the overlay is hidden, it is shown and the clock and volume controls are updated.
     */
    _toggleOverlay() {
        // Check if the overlay is visible
        if (this._overlay.visible) {
            // If visible, hide the overlay
            this._overlay.hide();
        } else {
            // If not visible, show the overlay and update the clock and volume controls
            this._overlay.show();
            this._clock.updateClock();
            this._soundControls.updateVolumeControls();
        }
    }
});

export default class GameBarExtension extends Extension {
    /**
     * Enables the extension by adding the GameBar panel button and keybinding.
     * The keybinding allows the user to toggle the visibility of the overlay widget.
     */
    enable() {
        // Create a new instance of the GameBar class
        this._button = new GameBar();

        // Add the GameBar panel button to the status area
        Main.panel.addToStatusArea('gamebar', this._button);

        // Add a keybinding to toggle the visibility of the overlay widget
        Main.wm.addKeybinding(
            'toggle-gamebar', // Keybinding name
            this.getSettings('org.gnome.shell.extensions.gnome-gamebar'), // Settings
            Meta.KeyBindingFlags.NONE, // Flags
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW, // Action modes
            () => {
                // Call the _toggleOverlay method of the GameBar panel button when the keybinding is triggered
                this._button._toggleOverlay();
            }
        );
    }

    /**
     * Disables the extension by removing the keybinding and destroying the status area button.
     */
    disable() {
        // If the button exists, destroy it
        if (this._button) {
            this._button.destroy();
            this._button = null;
        }
        // Remove the keybinding
        Main.wm.removeKeybinding('toggle-gamebar');
    }
}