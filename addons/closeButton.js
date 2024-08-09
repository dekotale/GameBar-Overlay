import St from 'gi://St';
import Clutter from 'gi://Clutter';

export class CloseButton {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._closeButton = null;
        this._createCloseButton();
    }

    /**
     * Creates the close button widget and adds it to the overlay.
     * The close button is positioned on the right side of the overlay.
     * Clicking the button will hide the overlay.
     */
    _createCloseButton() {
        // Create the close button widget
        this._closeButton = new St.Button({
            style_class: 'gamebar-close-button', // CSS class for styling
            child: new St.Icon({ icon_name: 'window-close-symbolic' }) // Icon for the close button
        });

        // Position the close button on the right side of the overlay
        let marginLeft = this._primaryMonitor.width - 100;
        this._closeButton.set_style(`margin-left: ${marginLeft}px;`);

        // Hide the overlay when the close button is clicked
        this._closeButton.connect('clicked', () => {
            this._overlay.hide();
        });

        // Add the close button to the overlay
        this._overlay.add_child(this._closeButton);

        //TODO:: make close by clicking in a empty area selectable in configuration
    }

    destroy() {
        // Remove the close button from the overlay
        this._overlay.remove_child(this._closeButton);
        this._closeButton = null;
    }
}