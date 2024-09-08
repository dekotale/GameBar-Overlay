import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import { getPositionStyle } from '../utils.js';

export class CloseButton {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._closeButton = null;
        this._addonContainer = null;
        this._widthChangeId = null;
        this._heightChangeId = null;
        this._createCloseButton();
    }

    /**
     * Creates the close button widget and adds it to the overlay.
     * The close button is positioned on the right side of the overlay.
     * Clicking the button will hide the overlay.
     */
    _createCloseButton() {
        this._addonContainer = new St.Widget({
            layout_manager: new Clutter.BinLayout()
          });

        // Create the close button widget
        this._closeButton = new St.Button({
            style_class: 'gamebar-close-button', // CSS class for styling
            child: new St.Icon({ icon_name: 'window-close-symbolic' }) // Icon for the close button
        });

        // Hide the overlay when the close button is clicked
        this._closeButton.connect('clicked', () => {
            this._overlay.hide();
        });

        this._addonContainer.add_child(this._closeButton)
        // Add the addon to the overlay
        this._overlay.add_child(this._addonContainer);

        // Add an event listener to close the overlay when clicking on an empty space
        this._overlay.connect('button-release-event', (actor, event) => {
          if (this._emptyAreaClose) {
            // Check if the overlay itself was clicked
            if (actor === this._overlay) {
                this._overlay.hide();
            }
          }
        });

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
        let position_style = getPositionStyle(this._primaryMonitor, this._position ?? "Top Right", this._addonContainer);
        this._addonContainer.set_position(position_style.x,position_style.y);
    }

    _updateSettings(settings) {
        this._position = "Top Right";
        this._emptyAreaClose = settings.get_boolean('overlay-empty-area-close');
        this.destroy();
        this._createCloseButton();
      }

    destroy() {
        //Disconnects the signals
        if(this._heightChangeId){
            this._addonContainer.disconnect(this._heightChangeId);
            this._heightChangeId = null;
        }
    
        if(this._widthChangeId){
            this._addonContainer.disconnect(this._widthChangeId);
            this._widthChangeId = null;
        }

        // Remove the close button from the overlay
        this._overlay.remove_child(this._closeButton);
        this._overlay.remove_child(this._addonContainer);
        this._closeButton?.destroy();
        this._closeButton = null;
        
        this._addonContainer?.destroy();
        this._addonContainer = null;
    }
}