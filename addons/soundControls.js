import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js';
import {Slider} from 'resource:///org/gnome/shell/ui/slider.js';
import Gio from 'gi://Gio';

export class SoundControls {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._volumeControl = Volume.getMixerControl();
        this._volumeSlider = null;
        this._volumeIcon = null;
        this._appVolumesBox = null;
        this._stream = null;
        this._streams = null;
        this._createVolumeControls();
    }

    // Create the main volume controls
    _createVolumeControls() {
        // Create the main volume panel
        let volumePanel = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.CENTER
        });

        // Create the volume icon button
        this._volumeIcon = new St.Button({
            child: new St.Icon({
                icon_name: 'audio-volume-high-symbolic',
                style_class: 'gamebar-volume-icon'
            })
        });

        // Create the volume slider
        this._volumeSlider = new Slider(0);
        this._volumeSlider.set_style('width: 300px;');
        this._volumeSlider.connect('notify::value', this._onVolumeChanged.bind(this));

        // Add the icon and slider to the panel
        volumePanel.add_child(this._volumeIcon);
        volumePanel.add_child(this._volumeSlider);

        // Connect the mute toggle to the icon
        this._volumeIcon.connect('clicked', this._toggleMute.bind(this));

        // Create a box for app-specific volume controls
        this._appVolumesBox = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
        });

        // Create a container for all volume controls
        let volumeContainer = new St.BoxLayout({
            vertical: true,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
            style_class: 'gamebar-volume-container-global'
        });

        volumeContainer.add_child(volumePanel);
        volumeContainer.add_child(this._appVolumesBox);

        // Add the volume container to the overlay
        this._overlay.add_child(volumeContainer);
    }

    // Update all volume controls
    updateVolumeControls() {
        // Get the default audio sink (main volume)
        this._stream = this._volumeControl.get_default_sink();
        this._streams = this._volumeControl.get_streams(); //WIP to fix Icons name problem

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
    
        // Check if the stream has an icon saved in system icons:
        icon = this._getAppInfoIconFromStreamName(stream);
        if (icon) return icon;

        let iconName = stream.get_icon_name();
        if (iconName) {
            icon = new Gio.ThemedIcon({ name: iconName});
            if (icon) return icon;
        }

        // Return generic if no icon found:
        return new Gio.ThemedIcon({ name: 'application-x-executable' });
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
            gicon: icon
        });
    
        // Create a volume slider for the app
        let slider = new Slider(stream.volume / this._volumeControl.get_vol_max_norm());
        slider.set_style('width: 300px;'); //TODO:: make configurable
        slider.connect('notify::value', () => {
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
        if (isMuted) {
            iconName = 'audio-volume-muted-symbolic';
        } else {
            let volume = this._volumeSlider.value;
            if (volume <= 0) {
                iconName = 'audio-volume-muted-symbolic';
            } else if (volume <= 0.3) {
                iconName = 'audio-volume-low-symbolic';
            } else if (volume <= 0.7) {
                iconName = 'audio-volume-medium-symbolic';
            } else {
                iconName = 'audio-volume-high-symbolic';
            }
        }
        this._volumeIcon.child.icon_name = iconName;
    }

    destroy() {
        this._overlay.remove_child(this._appVolumesBox);
        this._volumeSlider = null;
        this._volumeIcon = null;
        this._appVolumesBox = null;
        this._stream = null;
    }
}