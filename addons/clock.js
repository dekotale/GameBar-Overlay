import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

export class Clock {
  constructor(overlay, primaryMonitor) {
    this._overlay = overlay;
    this._primaryMonitor = primaryMonitor;
    this._timeLabel = null;
    this._timeoutId = null;
    this._createClockWidget();
  }

  _createClockWidget() {
    console.log("Clock create");
    // Create a label to display the time
    this._timeLabel = new St.Label({
      style_class: 'gamebar-time',
      text: '',
    });

    // Set the left margin of the label to center it horizontally on the primary monitor
    this._timeLabel.set_style(`margin-left: ${(this._primaryMonitor.width/2) - 100}px;`);

    // Create a box layout to hold the label
    let timeBox = new St.BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.START,
    });

    // Add the label to the box
    timeBox.add_child(this._timeLabel);

    // Add the box to the overlay
    this._overlay.add_child(timeBox);

    // Schedule the next update in ten seconds in case seconds are not displayed
    this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 10, () => {
        this._updateClock();
        return GLib.SOURCE_CONTINUE;
      });
  }

  _updateClock() {
    // Get the current local time
    let now = GLib.DateTime.new_now_local();

    // Format the time as "HH:MM"
    //TODO:: display seconds at optional parameter in configuration
    let time = now.format('%H:%M');

    // Update the clock widget with the new time
    this._timeLabel.set_text(time);
  }

  destroy() {
    // Remove the timeout
    if (this._timeoutId) {
      console.log("Source destroyed");
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }

    // Remove the clock widget from the overlay
    this._overlay.remove_child(this._timeLabel.get_parent());
  }
}