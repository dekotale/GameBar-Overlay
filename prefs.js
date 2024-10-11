import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class Preferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.gamebar-overlay');

        // General Page
        const generalPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(generalPage);

        // Appearance Group
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of the extension'),
        });
        generalPage.add(appearanceGroup);

        // Show Indicator
        const showIndicatorRow = new Adw.SwitchRow({
            title: _('Show Indicator'),
            subtitle: _('Shows the GameBar Overlay indicator in the Top-Bar'),
        });
        appearanceGroup.add(showIndicatorRow);
        settings.bind('show-indicator', showIndicatorRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        //Padding

        const overlayPaddingRow = new Adw.SpinRow({
            title: _('Padding'),
            subtitle: _('Space inside the overlay separating addons from screen edges'),
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 512,
                step_increment: 1,
                page_increment: 10,
            }),
        });
        appearanceGroup.add(overlayPaddingRow);
        settings.bind('overlay-padding', overlayPaddingRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        //Background color

        const colorButton = new Gtk.ColorButton();

        colorButton.use_alpha = true;

        const color = new Gdk.RGBA();
        color.parse(settings.get_string('overlay-background-color'));
        colorButton.set_rgba(color);

        colorButton.connect('color-set', () => {
            const newColor = colorButton.get_rgba().to_string();
            settings.set_string('overlay-background-color', newColor);
        });

        const overlayBackgroundColorRow = new Adw.ActionRow({
            title: 'Overlay background color',
            activatable_widget: colorButton
        });


        overlayBackgroundColorRow.add_suffix(colorButton);
        appearanceGroup.add(overlayBackgroundColorRow);

        // Behavior Group
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior'),
            description: _('Configure the behavior of the overlay'),
        }); 
        generalPage.add(behaviorGroup);

        /*
        // Overlay Opening Monitor
        const monitorRow = new Adw.ComboRow({
            title: _('Overlay Opening Monitor'),
            subtitle: _('Select the monitor to open the overlay on'),
            model: new Gtk.StringList({strings: ['Primary', 'Focused']}),
        });
        behaviorGroup.add(monitorRow);
        settings.bind('overlay-opening-monitor', monitorRow, 'selected', Gio.SettingsBindFlags.DEFAULT);

        monitorRow.connect('notify::selected', () => {
            const selectedIndex = monitorRow.selected;
            const selectedValue = monitorRow.model.get_string(selectedIndex);
            settings.set_string('overlay-opening-monitor', selectedValue);
        });*/

        // Close on Empty Area Click
        const emptyAreaCloseRow = new Adw.SwitchRow({
            title: _('Close on Empty Area Click'),
            subtitle: _('Close the overlay by clicking on an empty area'),
        });
        behaviorGroup.add(emptyAreaCloseRow);
        settings.bind('overlay-empty-area-close', emptyAreaCloseRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        //Keybinding group

        const keyBindingGroup = new Adw.PreferencesGroup({
            title: _('Keybinding'),
            description: _('Configure the keybinding of the overlay'),
        }); 
        generalPage.add(keyBindingGroup);

        //Custom Keyboard keybinding
        const shortcutComboValues = [
            'Super',
            'Shift',
            'Control',
            'Alt'
        ];
        
        const shortcutCombo = new Adw.ComboRow({
            title: _('First key'),
            model: new Gtk.StringList({strings: shortcutComboValues}),
        });

        shortcutCombo.set_selected(shortcutComboValues.indexOf(settings.get_string("toggle-gamebar-1")));
        
        keyBindingGroup.add(shortcutCombo);
        settings.bind('toggle-gamebar-1', shortcutCombo, 'selected', Gio.SettingsBindFlags.DEFAULT);

        shortcutCombo.connect('notify::selected', () => {
            const selectedIndex = shortcutCombo.selected;
            const selectedValue = shortcutCombo.model.get_string(selectedIndex);
            settings.set_string('toggle-gamebar-1', selectedValue);
            updateToggleGameBar();
        });

        const shortkeysValues = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 
            'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
            'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
            'Escape', 'Tab', 'CapsLock', 'Space', 
            'Enter', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Pause', 'ScrollLock'
        ];

        const shortkeys = new Adw.ComboRow({
            title: _('Last key'),
            model: new Gtk.StringList({strings: shortkeysValues}),
        });

        shortkeys.set_selected(shortkeysValues.indexOf(settings.get_string("toggle-gamebar-2")));
        keyBindingGroup.add(shortkeys);
        settings.bind('toggle-gamebar-2', shortkeys, 'selected', Gio.SettingsBindFlags.DEFAULT);

        shortkeys.connect('notify::selected', () => {
            const selectedIndex = shortkeys.selected;
            const selectedValue = shortkeys.model.get_string(selectedIndex);
            settings.set_string('toggle-gamebar-2', selectedValue);
            updateToggleGameBar();
        });


        function updateToggleGameBar() {
            const key1 = settings.get_string('toggle-gamebar-1');
            const key2 = settings.get_string('toggle-gamebar-2');
        
            const newShortcut = [`<${key1}>${key2}`];
            
            settings.set_value('toggle-gamebar', new GLib.Variant('as', newShortcut));
        }        
 
        // Clock Addon Page
        const clockPage = new Adw.PreferencesPage({
            title: _('Clock Addon'),
            icon_name: 'preferences-system-time-symbolic',
        });
        window.add(clockPage);

        const clockGroup = new Adw.PreferencesGroup({
            title: _('Clock Settings'),
            description: _('Configure the clock addon'),
        });
        clockPage.add(clockGroup);

        // Clock addon position
        const clockAddonPositionValues = [
            'Top Left', 'Top Center', 'Top Right', 
            'Center Left', 'Center Center', 'Center Right', 
            'Bottom Left', 'Bottom Center', 'Bottom Right'
        ];
 
        const clockAddonPosition = new Adw.ComboRow({
            title: _('Position'),
            subtitle: _('Position for the clock in the overlay'),
            model: new Gtk.StringList({strings: clockAddonPositionValues}),
        });

        clockAddonPosition.set_selected(clockAddonPositionValues.indexOf(settings.get_string("clock-addon-position")));
        
        clockGroup.add(clockAddonPosition);
        settings.bind('clock-addon-position', clockAddonPosition, 'selected', Gio.SettingsBindFlags.DEFAULT);

        clockAddonPosition.connect('notify::selected', () => {
            const selectedIndex = clockAddonPosition.selected;
            const selectedValue = clockAddonPosition.model.get_string(selectedIndex);
            settings.set_string('clock-addon-position', selectedValue);
        });

        // Show Seconds
        const showSecondsRow = new Adw.SwitchRow({
            title: _('Show Seconds'),
            subtitle: _('Show seconds in the clock addon'),
        });
        clockGroup.add(showSecondsRow);
        settings.bind('clock-addon-show-seconds', showSecondsRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Font Size
        const fontSizeRow = new Adw.SpinRow({
            title: _('Font Size'),
            subtitle: _('Font size for the clock'),
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 100,
                step_increment: 1,
                page_increment: 10,
            }),
        });
        clockGroup.add(fontSizeRow);
        settings.bind('clock-addon-font-size', fontSizeRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Sound Controls Page
        const soundPage = new Adw.PreferencesPage({
            title: _('Sound Controls'),
            icon_name: 'audio-volume-high-symbolic',
        });
        window.add(soundPage);

        const soundGroup = new Adw.PreferencesGroup({
            title: _('Sound Control Settings'),
            description: _('Configure the sound control panel'),
        });
        soundPage.add(soundGroup);

        // Sound addon position
        const soundAddonPositionValues = [
            'Top Left', 'Top Center', 'Top Right', 
            'Center Left', 'Center Center', 'Center Right', 
            'Bottom Left', 'Bottom Center', 'Bottom Right'
        ];
        const soundAddonPosition = new Adw.ComboRow({
            title: _('Position'),
            subtitle: _('Position for the sound panel in the overlay'),
            model: new Gtk.StringList({strings: soundAddonPositionValues}),
        });

        soundAddonPosition.set_selected(soundAddonPositionValues.indexOf(settings.get_string("sound-addon-position")));

        soundGroup.add(soundAddonPosition);
        settings.bind('sound-addon-position', soundAddonPosition, 'selected', Gio.SettingsBindFlags.DEFAULT);

        soundAddonPosition.connect('notify::selected', () => {
            const selectedIndex = soundAddonPosition.selected;
            const selectedValue = soundAddonPosition.model.get_string(selectedIndex);
            settings.set_string('sound-addon-position', selectedValue);
        });

        // Icon Size
        const iconSizeRow = new Adw.SpinRow({
            title: _('Icon Size'),
            subtitle: _('Icon size for the sound controls'),
            adjustment: new Gtk.Adjustment({
                lower: 16,
                upper: 48,
                step_increment: 1,
                page_increment: 8,
            }),
        });
        soundGroup.add(iconSizeRow);
        settings.bind('sound-controls-icon-size', iconSizeRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        /*// Show App Description
        const showAppDescRow = new Adw.SwitchRow({
            title: _('Show App Description'),
            subtitle: _('Show the description of the output audio stream'),
        });
        soundGroup.add(showAppDescRow);
        settings.bind('sound-controls-show-app-description', showAppDescRow, 'active', Gio.SettingsBindFlags.DEFAULT);
*/

        const soundExperimentalGroup = new Adw.PreferencesGroup({
            title: _('Experimental settings'),
            description: _('These settings are experimental WIP features and may dont work as expected'),
        });
        soundPage.add(soundExperimentalGroup);

        // Icon Type
        const soundIconTypeRowValues = ['Default', 'Symbolic'];
        const soundIconTypeRow = new Adw.ComboRow({
            title: _('Icon Type'),
            subtitle: _('Select the icon type: Default or Symbolic'),
            model: new Gtk.StringList({strings: soundIconTypeRowValues}),
        });

        soundIconTypeRow.set_selected(soundIconTypeRowValues.indexOf(settings.get_string("sound-icon-type")));

        soundExperimentalGroup.add(soundIconTypeRow);
        settings.bind('sound-icon-type', soundIconTypeRow, 'selected', Gio.SettingsBindFlags.DEFAULT);

        soundIconTypeRow.connect('notify::selected', () => {
            const selectedIndex = soundIconTypeRow.selected;
            const selectedValue = soundIconTypeRow.model.get_string(selectedIndex);
            settings.set_string('sound-icon-type', selectedValue);
        });
    }
}