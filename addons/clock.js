import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import { getPositionStyle } from '../utils.js';

export class Clock {
  constructor(overlay, primaryMonitor) {
    this._overlay = overlay;
    this._primaryMonitor = primaryMonitor;
    this._widthChangeId = null;
    this._heightChangeId = null;
    this._timeLabel = null;
    this._timeoutId = null;
    this._addonContainer = null;
    this._visibilityChangedId = null;
    this._createClockWidget();
  }

  _createClockWidget() {
    // Create a label to display the time
    this._timeLabel = new St.Label({
      style_class: 'gamebar-time',
      text: '',
    });

    // Set the left margin of the label to center it horizontally on the primary monitor
    this._timeLabel.set_style(`
      font-size: ${this._clockFontSize}px;
    `);

    // Create a box layout to hold the label and position it
    this._addonContainer = new St.Widget({
      layout_manager: new Clutter.BinLayout()
    });

    // Add the label to the box
    this._addonContainer.add_child(this._timeLabel);

    // Add the box to the overlay
    this._overlay.add_child(this._addonContainer);

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

    // Connect to overlay visibility changes
    this._visibilityChangedId = this._overlay.connect('notify::visible', () => {
      if (this._overlay.visible) {
        this._startClock();
      } else {
        this._stopClock();
      }
    });

    // Initial update if overlay is visible
    if (this._overlay.visible) {
      this._startClock();
    }
  }

  _startClock() {
    // Initial update
    this._updateClock();

    // Start the timer only if it's not already running
    if (!this._timeoutId) {
      this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
        this._updateClock();
        return GLib.SOURCE_CONTINUE;
      });
    }
  }

  _stopClock() {
    // Remove the timeout if it exists
    if (this._timeoutId) {
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }
  }

  set_addon_position() {
    let position_style = getPositionStyle(this._primaryMonitor, this._position, this._addonContainer);
    this._addonContainer.set_position(position_style.x, position_style.y);
  }

  _updateClock() {
    // Only update if the overlay is visible
    if (!this._overlay.visible) {
      return false;
    }

    // Get the current local time
    let now = GLib.DateTime.new_now_local();

    // Format the time based on settings
    let time = this._showSeconds ? now.format('%H:%M:%S') : now.format('%H:%M');

    // Update the clock widget with the new time
    this._timeLabel.set_text(time);

    return true;
  }

  _updateSettings(settings) {
    this._clockFontSize = settings.get_int('clock-addon-font-size');
    this._showSeconds = settings.get_boolean('clock-addon-show-seconds');
    this._position = settings.get_string('clock-addon-position');

    // Recreate the widget with new settings
    this._stopClock();
    this.destroy();
    this._createClockWidget();
  }

  destroy() {
    // Stop the clock updates
    this._stopClock();

    // Disconnect all signals
    if (this._heightChangeId) {
      this._addonContainer.disconnect(this._heightChangeId);
      this._heightChangeId = null;
    }

    if (this._widthChangeId) {
      this._addonContainer.disconnect(this._widthChangeId);
      this._widthChangeId = null;
    }

    if (this._visibilityChangedId) {
      this._overlay.disconnect(this._visibilityChangedId);
      this._visibilityChangedId = null;
    }

    // Remove the clock widget from the overlay
    if (this._timeLabel && this._timeLabel.get_parent()) {
      this._overlay.remove_child(this._timeLabel.get_parent());
    }

    // Cleanup
    this._timeLabel?.destroy();
    this._timeLabel = null;
    this._addonContainer?.destroy();
    this._addonContainer = null;
  }
}