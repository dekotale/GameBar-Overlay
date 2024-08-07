import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

export class Clock {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._timeLabel = null;
        this._createClockWidget();
    }

    /**
     * Creates the clock widget and adds it to the overlay.
     * The clock widget is positioned at the center of the primary monitor.
     * The clock widget displays the current time.
     */
    _createClockWidget() {
        // Create a label to display the time
        this._timeLabel = new St.Label({
            style_class: 'gamebar-time', // CSS class for styling
            text: '' // Initial time is empty
        });

        // Set the left margin of the label to center it horizontally on the primary monitor
        this._timeLabel.set_style(`margin-left: ${(this._primaryMonitor.width/2) - 100}px;`);

        // Create a box layout to hold the label
        let timeBox = new St.BoxLayout({
            vertical: true, // Stack vertically
            x_expand: true, // Expand horizontally to fill the width of the parent
            y_expand: true, // Expand vertically to fill the height of the parent
            x_align: Clutter.ActorAlign.CENTER, // Center horizontally
            y_align: Clutter.ActorAlign.START // Align to the top
        });

        // Add the label to the box
        timeBox.add_child(this._timeLabel);

        // Add the box to the overlay
        this._overlay.add_child(timeBox);
    }

    /**
     * Updates the clock widget with the current time.
     * If the overlay is visible, it schedules the next update.
     */
    updateClock() {
        // Get the current local time
        let now = GLib.DateTime.new_now_local();
        // Format the time as "HH:MM"
        let time = now.format('%H:%M');
        // Update the clock widget with the new time
        this._timeLabel.set_text(time);

        // If the overlay is visible, schedule the next update
        if (this._overlay.visible) {
            // Schedule the next update in one second
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                // Call the updateClock method again
                this.updateClock();
                // Return GLib.SOURCE_REMOVE to remove the source after the update
                return GLib.SOURCE_REMOVE;
            });
        }
    }
}