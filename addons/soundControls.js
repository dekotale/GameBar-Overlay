import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';
import Gio from 'gi://Gio';
import { getPositionStyle } from '../utils.js';
import GLib from 'gi://GLib';

export class SoundControls {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._volumeControl = Volume.getMixerControl();
        this._volumeSlider = null;
        this._volumeIcon = null;
        this._appVolumesContainer = null;
        this._appVolumesBox = null;
        this._stream = null;
        this._addonContainer = null;
        //Listeners:
        this._widthChangeId = null;
        this._heightChangeId = null;
        this._VolumeSliderNotifyId = null;
        this._VolumeIconCLickedId = null;
        this._SliderNotifyId = null;
    }

    // Create the main volume controls
    _createVolumeControls() {
        let iconType = (this._iconType === 'Symbolic' ? '-symbolic' : '');

        this._addonContainer = new St.Widget({
            layout_manager: new Clutter.BinLayout()
        });

        // Create a container for all volume controls
        this._appVolumesContainer = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
            style_class: 'gamebar-volume-container-global'
        });

        // Create the main volume panel
        let volumePanel = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER
        });

        // Create the volume icon button
        this._volumeIcon = new St.Button({
            child: new St.Icon({
                icon_name: 'audio-volume-high'+iconType,
                style_class: 'gamebar-volume-icon',
                icon_size: this._icon_Size
            })
        });

        // Create the volume slider
        this._volumeSlider = new Slider(0);
        this._volumeSlider.set_style('width: 300px;');
        this._VolumeSliderNotifyId = this._volumeSlider.connect('notify::value', this._onVolumeChanged.bind(this));

        // Add the icon and slider to the panel
        volumePanel.add_child(this._volumeIcon);
        volumePanel.add_child(this._volumeSlider);

        // Connect the mute toggle to the icon
        this._VolumeIconCLickedId = this._volumeIcon.connect('clicked', this._toggleMute.bind(this));

        // Create a box for app-specific volume controls
        this._appVolumesBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
        });

        this._appVolumesContainer.add_child(volumePanel);
        this._appVolumesContainer.add_child(this._appVolumesBox);

        this._addonContainer.add_child(this._appVolumesContainer)

        // Add the addon container to the overlay
        this._overlay.add_child(this._addonContainer);

        //Add the listeners for change width and height:

        this._widthChangeId = this._addonContainer.connect('notify::width', () => {
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
              this.set_addon_position();
              return GLib.SOURCE_REMOVE;
            });
          });
        
          this._heightChangeId = this._addonContainer.connect('notify::height', () => {
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
              this.set_addon_position();
              return GLib.SOURCE_REMOVE;
            });
          });
    }

    set_addon_position(){
        let position_style = getPositionStyle(this._primaryMonitor, this._position, this._addonContainer);
        this._addonContainer.set_position(position_style.x,position_style.y);
      }

    // Update all volume controls
    updateVolumeControls() {
        // Get the default audio sink (main volume)
        this._stream = this._volumeControl.get_default_sink();

        if (this._stream) {
            // Update the main volume slider
            this._volumeSlider.value = this._stream.volume / this._volumeControl.get_vol_max_norm();
            this._updateVolumeIcon(this._stream.is_muted);
        }

        // Clear existing app volume controls
        this._appVolumesBox.destroy_all_children();
        
        // Get all audio streams (for app-specific volumes)
        let sinkInputs = this._volumeControl.get_sink_inputs();
        
        // Create volume controls for each app
        sinkInputs.forEach((inputStream, index) => {
            if (inputStream.is_event_stream) {
                return; // Skip event streams
            }
        
            // Create a box for label and volumeBox
            let labelBox = new St.BoxLayout({
                vertical: true,
                x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.START
            });
        
            // Create a label for the app name
            let label = new St.Label({
                text: inputStream.get_name() || inputStream.get_description(),
                y_align: Clutter.ActorAlign.CENTER
            });

            // Add the separator for only first item
            if (index == 0) {
                labelBox.add_child(new St.DrawingArea({
                    style_class: 'separator',
                    x_expand: true,
                }));
            }
        
            label.style_class = 'gamebar-app-volume-label';
            labelBox.add_child(label);
            labelBox.add_child(this._createAppVolumeControl(inputStream));
        
            // Add the separator except for the last item
            if (index < sinkInputs.length - 1) {
                labelBox.add_child(new St.DrawingArea({
                    style_class: 'separator',
                    x_expand: true,
                }));
            }
        
            this._appVolumesBox.add_child(labelBox);
        });        
    }

    // Create a volume control for a specific app
    _getAppIcon(stream) {
        let icon = null;
        let iconType = (this._iconType === 'Symbolic' ? '-symbolic' : '');
        
        // TODO:: Search for symbolic icons

        // Check if the stream has an icon saved in system icons:
        icon = this._getAppInfoIconFromStreamName(stream);
        if (icon) return icon;

        let iconName = stream.get_icon_name();
        if (iconName && iconName != 'application-x-executable') {
            icon = new Gio.ThemedIcon({ name: iconName});
            if (icon) return icon;
        }

        // Return generic if no icon found:
        return new Gio.ThemedIcon({ name: 'application-x-executable'+iconType });
    }
    
    _getAppInfoIconFromStreamName(stream) {
        const cleanString = (str) => {
            if (!str) return '';
            return str.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, '')
                .replace(/browser|player|viewer/g, '');
        };
    
        const calculateMatchScore = (str1, str2) => {
            const clean1 = cleanString(str1);
            const clean2 = cleanString(str2);
            if (clean1 === clean2) return 100;
            if (clean1.includes(clean2)) return 75;
            if (clean2.includes(clean1)) return 75;
            return 0;
        };
    
        const streamName = cleanString(stream.get_name());
        const streamIconName = cleanString(stream.get_icon_name());
        const allApps = Gio.AppInfo.get_all();
    
        let bestMatch = {
            app: null,
            score: 0
        };
    
        for (let app of allApps) {
            const appName = cleanString(app.get_display_name());
            const appId = cleanString(app.get_id());
    
            if (appName && streamName && stream.get_name()) {
                const nameScore = Math.max(
                    calculateMatchScore(appName, streamName),
                    calculateMatchScore(appId, streamName),
                    calculateMatchScore(appName, streamIconName),
                    calculateMatchScore(appId, streamIconName)
                );
    
                if (nameScore > bestMatch.score) {
                    bestMatch = {
                        app: app,
                        score: nameScore
                    };
                }
            }
        }
    
        if (bestMatch.app) {
            return bestMatch.app.get_icon();
        }
    
        return null;
    }
    
    // Create a volume control for a specific app
    _createAppVolumeControl(stream) {
        let container = new St.BoxLayout({
            style_class: 'gamebar-app-volume-control',
            vertical: false,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER
        });
    
        let icon = this._getAppIcon(stream);
    
        // Create an icon for the app
        let APPicon = new St.Icon({
            style_class: 'gamebar-app-volume-icon',
            gicon: icon,
            icon_size: this._icon_Size
        });
    
        // Create a volume slider for the app
        let slider = new Slider(stream.volume / this._volumeControl.get_vol_max_norm());
        slider.set_style('width: 300px;'); //TODO:: make configurable
        this._SliderNotifyId = slider.connect('notify::value', () => {
            stream.volume = slider.value * this._volumeControl.get_vol_max_norm();
            stream.push_volume();
        });
    
        // Add all elements to the container
        container.add_child(APPicon);
        container.add_child(slider);
    
        return container;
    }
    

    // Handle changes to the main volume slider
    _onVolumeChanged() {
        if (this._stream) {
            let volume = this._volumeSlider.value * this._volumeControl.get_vol_max_norm();
            this._stream.volume = volume;
            this._stream.push_volume();
            this._updateVolumeIcon(this._stream.is_muted);
        }
    }

    // Toggle mute state for the main volume
    _toggleMute() {
        if (this._stream) {
            let isMuted = !this._stream.is_muted;
            this._stream.change_is_muted(isMuted);
            this._updateVolumeIcon(isMuted);
        }
    }

    // Update the main volume icon based on volume level and mute state
    _updateVolumeIcon(isMuted) {
        let iconName;
        let iconType = (this._iconType === 'Symbolic' ? '-symbolic' : '');
        if (isMuted) {
            iconName = 'audio-volume-muted' + iconType;
        } else {
            let volume = this._volumeSlider.value;
            if (volume <= 0) {
                iconName = 'audio-volume-muted' + iconType;
            } else if (volume <= 0.3) {
                iconName = 'audio-volume-low' + iconType;
            } else if (volume <= 0.7) {
                iconName = 'audio-volume-medium' + iconType;
            } else {
                iconName = 'audio-volume-high' + iconType;
            }
        }
        this._volumeIcon.child.icon_name = iconName;
    }

    _updateSettings(settings) {
        this._icon_Size = settings.get_int('sound-controls-icon-size');
        this._showAppDesc = settings.get_boolean('sound-controls-show-app-description');
        this._iconType = settings.get_string('sound-icon-type');
        this._position = settings.get_string('sound-addon-position');
        this.destroy();
        this._volumeControl = Volume.getMixerControl();
        this._createVolumeControls();
        this.updateVolumeControls();
    }

    destroy() {
        if (this._appVolumesContainer && this._appVolumesContainer.get_parent() === this._overlay) {
          this._overlay.remove_child(this._appVolumesContainer);
        }

        if (this._addonContainer && this._addonContainer.get_parent() === this._overlay) {
            this._overlay.remove_child(this._addonContainer);
        }
      
        if (this._appVolumesBox && this._appVolumesBox.get_parent() === this._overlay) {
          this._overlay.remove_child(this._appVolumesBox);
        }

        //Disconnects the signals
        if(this._heightChangeId){
            this._addonContainer.disconnect(this._heightChangeId);
            this._heightChangeId = null;
        }
  
        if(this._widthChangeId){
            this._addonContainer.disconnect(this._widthChangeId);
            this._widthChangeId = null;
        }

        if(this._VolumeSliderNotifyId){
            this._volumeSlider.disconnect(this._VolumeSliderNotifyId)
            this._VolumeSliderNotifyId = null;
        }
        if(this._VolumeIconCLickedId){
            this._volumeIcon.disconnect(this._VolumeIconCLickedId);
            this._VolumeIconCLickedId = null;
        }
        if(this._SliderNotifyId){
            this._SliderNotifyId = null;
        }

        this._volumeSlider?.destroy();
        this._volumeSlider = null;
        this._volumeIcon?.destroy();
        this._volumeIcon = null;
        this._volumePanel = null;
        this._appVolumesBox?.destroy();
        this._appVolumesBox = null;
        this._stream = null;
        this._volumeControl = null;
        this._appVolumesContainer?.destroy();
        this._appVolumesContainer = null;
        this._addonContainer = null;
      }
}