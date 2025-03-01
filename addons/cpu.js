import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GTop from 'gi://GTop';
import Gio from 'gi://Gio';
import { getPositionStyle } from '../utils.js';

export class CPU {
  constructor(overlay, primaryMonitor) {
    this._overlay = overlay;
    this._primaryMonitor = primaryMonitor;
    this._widthChangeId = null;
    this._heightChangeId = null;
    this._cpuContainer = null;
    this._cpuUsageLabel = null;
    this._cpuLabel = null;
    this._tempContainer = null;
    this._tempLabel = null;
    this._timeoutId = null;
    this._addonContainer = null;
    this._visibilityChangedId = null;
    this._hwmonPath = null;
    this._prevCpu = null;
    this._createCPUWidget();
  }

  _createCPUWidget() {
    this._prevCpu = new GTop.glibtop_cpu();
    this._findHwmon();
  
    this._addonContainer = new St.Widget({
      layout_manager: new Clutter.BinLayout()  
    });
  
    // Create a container for CPU stats
    this._cpuContainer = new St.BoxLayout({
      vertical: true,
      style_class: 'gamebar-cpu-container'
    });
  
    // Create the CPU title label
    this._cpuLabel = new St.Label({
        style_class: 'gamebar-cpu-label',
        text: 'CPU'
    });
  
    // Create CPU usage label
    this._cpuUsageLabel = new St.Label({
        style_class: 'gamebar-cpu-usage',
    });
  
    // Create CPU temperature label
    this._tempLabel = new St.Label({
        style_class: 'gamebar-cpu-temp'
    });
  
    this._cpuContainer.add_child(this._cpuLabel);
    this._cpuContainer.add_child(this._cpuUsageLabel);
    this._cpuContainer.add_child(this._tempLabel);
  
    this._addonContainer.add_child(this._cpuContainer);
  
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
  
    // Connect to overlay visibility changes
    this._visibilityChangedId = this._overlay.connect('notify::visible', () => {
      if (this._overlay.visible) {
        this._startMonitor();
      } else {
        this._stopMonitor();
      }
    });
  
    // Initial update if overlay is visible
    if (this._overlay.visible) {
      this._startMonitor();
    }
  }  

  _startMonitor() {
    // Initial update
    this._updateMonitor();

    // Start the timer only if it's not already running
    if (!this._timeoutId) {
      this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
        this._updateMonitor();
        return GLib.SOURCE_CONTINUE;
      });
    }
  }

  _stopMonitor() {
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

  _getCpuUsage() {
    const cpu = new GTop.glibtop_cpu();
    GTop.glibtop_get_cpu(cpu);

    const total = cpu.total - this._prevCpu.total;
    const user = cpu.user - this._prevCpu.user;
    const sys = cpu.sys - this._prevCpu.sys;
    const nice = cpu.nice - this._prevCpu.nice;

    this._prevCpu = cpu;

    return Math.round((user + sys + nice) / Math.max(total, 1.0) * 100);
  }

  // TODO: move to utils
  _readFile(path) {
    const file = Gio.File.new_for_path(path);
    const [success, contents] = file.load_contents(null); // "success" is required for this function to work, probably needs some error handling here

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(contents);
  }

  // TODO: move to utils
  _listDir(path) {
    const dir = Gio.File.new_for_path(path);
    const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
    
    let files = [];
    let fileInfo;
    
    while ((fileInfo = enumerator.next_file(null)) !== null) {
        files.push(fileInfo);
    }
    
    return files;
  }

  // TODO: move to utils for future sensors
  // TODO: handle whatever errors may appear, or when hwmon is missing.
  _findHwmon() {
    // Known CPU hwmon drivers
    const drivers = ['zenpower', 'k10temp']; 
    
    // Find the correct hwmon driver
    let hwmonDirs = this._listDir("/sys/class/hwmon/");
    for (let i = 0; i < hwmonDirs.length; i++) {
        let hwmonDir = hwmonDirs[i];
        let hwmonBasePath = "/sys/class/hwmon/" + hwmonDir.get_name();
        let driverName = this._readFile(hwmonBasePath + "/name").trim();

        if (drivers.includes(driverName)) {
          this._hwmonPath = hwmonBasePath + '/temp1_input';
      }
    }
  }

  _getCpuTemperature() {
    const temperature = this._readFile(this._hwmonPath);

    // Convert from millidegrees Celsius to Celsius
    // TODO: implement Fahrenheit?
    return Math.round(temperature / 1000);
  }

  _updateMonitor() {
    // Only update if the overlay is visible
    if (!this._overlay.visible) {
      return false;
    }

    // Update the clock widget with the new time
    this._cpuUsageLabel.set_text(this._getCpuUsage() + "%");
    this._tempLabel.set_text(this._getCpuTemperature() + "°C");

    return true;
  }

  _updateSettings(settings) {
    this._position = settings.get_string('cpu-addon-position');

    // Recreate the widget with new settings
    this._stopMonitor();
    this.destroy();
    this._createCPUWidget();
  }

destroy() {
    // Stop the monitor
    this._stopMonitor();

    // Disconnect signals
    if (this._heightChangeId > 0) {
      this._addonContainer.disconnect(this._heightChangeId);
      this._heightChangeId = null;
    }

    if (this._widthChangeId > 0) {
      this._addonContainer.disconnect(this._widthChangeId);
      this._widthChangeId = null;
    }

    if (this._visibilityChangedId > 0) {
      this._overlay.disconnect(this._visibilityChangedId);
      this._visibilityChangedId = null;
    }

    // Destroy childrens and remove them from their parent
    if (this._cpuUsageLabel) {
        this._cpuContainer.remove_child(this._cpuUsageLabel);
        this._cpuUsageLabel.destroy();
        this._cpuUsageLabel = null;
    }
    if (this._cpuLabel) {
        this._cpuContainer.remove_child(this._cpuLabel);
        this._cpuLabel.destroy();
        this._cpuLabel = null;
    }
    if (this._tempLabel) {
        this._cpuContainer.remove_child(this._tempLabel);
        this._tempLabel.destroy();
        this._tempLabel = null;
    }
    if (this._cpuContainer) {
      this._addonContainer.remove_child(this._cpuContainer)
      this._cpuContainer.destroy();
      this._cpuContainer = null
    }

    // Destroy the addon container and remove it from the overlay.
    if (this._addonContainer && this._addonContainer.get_parent()) {
      this._overlay.remove_child(this._addonContainer);
      this._addonContainer.destroy();
      this._addonContainer = null;
    }


    // Cleanup properties
    this._prevCpu = null;
    this._hwmonPath = null;
  }
}
