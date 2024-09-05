import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import { set_padding_setting } from './utils.js';

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
            layout_manager: new Clutter.BinLayout(),
            style_class: 'gamebar-overlay', // CSS class for styling
            reactive: true, // Enable reactive handling of events
            can_focus: true, // Enable focus handling
            x_expand: true, // Expand horizontally to fill the width of the parent
            y_expand: true, // Expand vertically to fill the height of the parent
            visible: false, // Start hidden
        });
    
        this._updateOverlayGeometry(Main.layoutManager.primaryMonitor);

        // Create instances of addons and pass the overlay widget and the primary monitor
        this._clock = new Clock(this._overlay, primaryMonitor); // Clock addon
        this._closeButton = new CloseButton(this._overlay, primaryMonitor); // Close button addon
        this._soundControls = new SoundControls(this._overlay, primaryMonitor); // Sound controls addon
    
        // Add the overlay widget to the layout manager to affect the input region
        Main.layoutManager.addChrome(this._overlay, { affectsInputRegion: true});
    
        // Connect to 'monitors-changed' signal to update overlay position and size
        this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => {
            //TODO:: fix bug: when change to a diferent resolution monitor, the size wont update properly
            this._updateOverlayGeometry(Main.layoutManager.primaryMonitor);
        });

        // Connect to 'session-mode-changed' signal to update overlay visibility in some situations
        this._sessionModeChangedId = Main.sessionMode.connect('updated', () => {
            this._onSessionModeChanged();
        });
    }

    //Update overlay geometry
    _updateOverlayGeometry(primaryMonitor) {
        this._overlay.set_position(primaryMonitor.x, primaryMonitor.y);
        this._overlay.set_size(primaryMonitor.width, primaryMonitor.height);
        this._overlay.hide();
    }

    /**
     * Handles the 'session-mode-changed' signal.
     * Hides the overlay widget if the session mode is 'unlock-dialog', 'lock-screen', 'login', or 'gdm'.
     */
    _onSessionModeChanged() {
        // Get the current session mode
        let mode = Main.sessionMode.currentMode;

        // Check if the session mode is one of the specified modes
        if (mode === 'unlock-dialog' || mode === 'lock-screen' || mode === 'login' || mode === 'gdm') {
            // If it is, hide the overlay widget
            if (this._overlay.visible) {
                this._overlay.hide();
            }
        }
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
            this._clock._updateClock();
            this._soundControls.updateVolumeControls();
        }
    }

    /**
     * Loads the settings
     */
    _loadSettings(settings) {
        // Store the settings object
        this._settings = settings;

        // Update the settings of the addons with the new settings
        this._updateSettings(settings);
    }

    // Called when any settings has changed
    _onSettingsChanged(settings) {
        //load the new settings:
        this._loadSettings(settings);
    }

    _updateSettings(settings) {
        //Update addons settings
        this._clock._updateSettings(settings);
        this._soundControls._updateSettings(settings);
        this._closeButton._updateSettings(settings);
        set_padding_setting(settings.get_int('overlay-padding'))
    }

    /**
     * Destroys the GameBar extension.
     * This method is called when the extension is disabled or being removed.
     * It destroys the clock addon and calls the parent class's destroy method.
     */
    destroy() {
        // Destroy the clock addon
        this._clock.destroy();
        // Destroy the closeButton addon
        this._closeButton.destroy();
        // Destroy the soundControls addon
        this._soundControls.destroy();

        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = null;
        }

        if (this._sessionModeChangedId) {
            Main.layoutManager.disconnect(this._sessionModeChangedId);
            this._sessionModeChangedId = null;
        }

        // Call the parent class's destroy method
        super.destroy();
    }
});

export default class GameBarExtension extends Extension {
    /**
     * Enables the extension by adding the GameBar panel button and keybinding.
     * The keybinding allows the user to toggle the visibility of the overlay widget.
     */
    enable() {
        // Get the extension settings in a variable
        this._settings = this.getSettings('org.gnome.shell.extensions.gamebar-overlay');

        // Create a new instance of the GameBar class
        this._gamebar = new GameBar();

        // Add the GameBar panel button to the status area
        Main.panel.addToStatusArea(this.uuid, this._gamebar);

        this._settings.bind('show-indicator', this._gamebar, 'visible',
            Gio.SettingsBindFlags.DEFAULT);

        // Add a keybinding to toggle the visibility of the overlay widget
        Main.wm.addKeybinding(
            'toggle-gamebar', // Keybinding name
            this._settings, // Settings
            Meta.KeyBindingFlags.NONE, // Flags
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW, // Action modes
            () => {
                // Call the _toggleOverlay method of the GameBar panel button when the keybinding is triggered
                this._gamebar._toggleOverlay();
            }
        );

        // Connect to setting changes
        this._settingsChangedId = this._settings.connect('changed', this._gamebar._onSettingsChanged.bind(this._gamebar));

        // Initial load of settings
        this._gamebar._loadSettings(this._settings);
    }

    /**
     * Disables the extension by removing the keybinding and destroying the status area button.
     */
    disable() {
        // If the button exists, destroy it
        if (this._gamebar) {
            this._gamebar?.destroy();
            this._gamebar = null;
        }

        // Remove the keybinding
        Main.wm.removeKeybinding('toggle-gamebar');

        // Set the extension settings to null
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        this._settings = null;
    }
}