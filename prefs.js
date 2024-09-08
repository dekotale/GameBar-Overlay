import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
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

        /*// Behavior Group
        const behaviorGroup = new Adw.PreferencesGroup({
            title: _('Behavior'),
            description: _('Configure the behavior of the overlay --Coming soon--'),
        }); 
        generalPage.add(behaviorGroup);

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
        });

        // Close on Empty Area Click
        const emptyAreaCloseRow = new Adw.SwitchRow({
            title: _('Close on Empty Area Click'),
            subtitle: _('Close the overlay by clicking on an empty area'),
        });
        behaviorGroup.add(emptyAreaCloseRow);
        settings.bind('overlay-empty-area-close', emptyAreaCloseRow, 'active', Gio.SettingsBindFlags.DEFAULT);*/

        // TODO:: custom Keyboard Shortcut
        /*const shortcutRow = new Adw.ActionRow({
            title: _('Toggle GameBar Shortcut'),
            subtitle: _('Keyboard shortcut to show/hide the GameBar overlay'),
        });
        behaviorGroup.add(shortcutRow);*/
 
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