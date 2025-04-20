import St from 'gi://St';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import { getPositionStyle, readFile, getGpuDriver, listGpus, findCpuHwmon, findFirstHwmon, celsiusToFahrenheit } from '../utils.js';

// Import GTop conditionally
let GTop = null;
try {
    GTop = await import('gi://GTop');
} catch (e) {
    // GTop is not available, it is already null
}

export class CPU {
    constructor(overlay, primaryMonitor) {
        this._overlay = overlay;
        this._primaryMonitor = primaryMonitor;
        this._widthChangeId = null;
        this._heightChangeId = null;
        this._cpuContainer = null;
        this._cpuUsageLabel = null;
        this._cpuLabel = null;
        this._cpuTempLabel = null;

        this._gpuMonitoring = null;
        this._gpuContainer = null;
        this._gpuUsageLabel = null;
        this._gpuLabel = null;
        this._gpuTempLabel = null;
        this._gpuDevice = null;
        
        this._timeoutId = null;
        this._addonContainer = null;
        this._visibilityChangedId = null;
        this._hwmonPath = null;
        this._prevCpu = null;
        this._gtopAvailable = GTop !== null;
        this._tempUnit = 'C'; // Default to Celsius
        this._createCPUWidget();
    }

    _createCPUWidget() {
        if (this._gtopAvailable) {
            this._prevCpu = new GTop.default.glibtop_cpu();
        }
        this._hwmonPath = findCpuHwmon();

        this._addonContainer = new St.Widget({
            layout_manager: new Clutter.BinLayout()
        });

        this._hwmonContainer = new St.BoxLayout({
          vertical: false
        });

        // Create a container for CPU stats
        this._cpuContainer = new St.BoxLayout({
            vertical: true,
            style_class: 'gamebar-cpu-container'
        });

        // Create the CPU title label
        this._cpuLabel = new St.Label({
            style_class: 'gamebar-cpu-label',
            text: _('CPU')
        });

        // Create CPU usage label
        this._cpuUsageLabel = new St.Label({
            style_class: 'gamebar-cpu-usage',
        });

        // Create CPU temperature label (or GTop missing message)
        this._cpuTempLabel = new St.Label({
            style_class: 'gamebar-cpu-temp'
        });

        this._cpuContainer.add_child(this._cpuLabel);
        this._cpuContainer.add_child(this._cpuUsageLabel);
        this._cpuContainer.add_child(this._cpuTempLabel);
        
        // Add the CPU container to the main container
        this._hwmonContainer.add_child(this._cpuContainer);

        // Add GPU container if GPU monitoring is enabled.
        if (this._gpuMonitoring) {
            // Create a container for GPU stats
            this._gpuContainer = new St.BoxLayout({
              vertical: true,
              style_class: 'gamebar-cpu-container'
          });

          // Create the GPU title label
          this._gpuLabel = new St.Label({
              style_class: 'gamebar-cpu-label',
              text: _('GPU')
          });

          // Create GPU usage label
          this._gpuUsageLabel = new St.Label({
              style_class: 'gamebar-cpu-usage',
          });

          // Create GPU temperature label (or GTop missing message)
          this._gpuTempLabel = new St.Label({
              style_class: 'gamebar-cpu-temp'
          });

          this._gpuContainer.add_child(this._gpuLabel);
          this._gpuContainer.add_child(this._gpuUsageLabel);
          this._gpuContainer.add_child(this._gpuTempLabel);

          // Add the GPU container to the main container
          this._hwmonContainer.add_child(this._gpuContainer);
        }

        // Add the main container to the addon container
        this._addonContainer.add_child(this._hwmonContainer);

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
    if (!this._gtopAvailable){
      return '-';
    }

    const cpu = new GTop.default.glibtop_cpu();
    GTop.default.glibtop_get_cpu(cpu);

    const total = cpu.total - this._prevCpu.total;
    const user = cpu.user - this._prevCpu.user;
    const sys = cpu.sys - this._prevCpu.sys;
    const nice = cpu.nice - this._prevCpu.nice;

    this._prevCpu = cpu;

    return Math.round((user + sys + nice) / Math.max(total, 1.0) * 100);
  }

  _getCpuTemperature() {
    if (!this._hwmonPath) {
      return { temp: _("N/A"), unit: "" };
    }

    const temperature = readFile(this._hwmonPath);
    if (temperature === null) {
      return { temp: _("Error"), unit: "" };
    }

    let celsius = Math.round(parseInt(temperature) / 1000);
    let tempValue;
    let unitSymbol;

    if (this._tempUnit === 'C') {
      tempValue = celsius;
      unitSymbol = "°C";
    } else { // Fahrenheit
      tempValue = Math.round(celsiusToFahrenheit(celsius));
      unitSymbol = "°F";
    }
    return { temp: tempValue, unit: unitSymbol};
    }

    _getGpuUsage() {
      this._checkValidGpuDevice();
      const driver = getGpuDriver(this._gpuDevice);
      // TODO: Support more drivers.
      if (driver == "amdgpu" || driver == "i915" || driver == "xe") {
        const usagePath = "/sys/class/drm/" + this._gpuDevice + "/device/gpu_busy_percent"
        const usage = readFile(usagePath);
        return usage;
      }
      return "-"
    }

    _getGpuTemperature() {
      this._checkValidGpuDevice();
      const driver = getGpuDriver(this._gpuDevice);
      let temperature;

      // TODO: Support more drivers.
      if (driver == "amdgpu" || driver == "i915" || driver == "xe") {
        const path = findFirstHwmon(this._gpuDevice) + "/temp1_input";
        temperature = readFile(path);
      }

      const celsius = Math.round(parseInt(temperature) / 1000);
      let tempValue;
      let unitSymbol;
  
      if (this._tempUnit === 'C') {
          tempValue = celsius;
          unitSymbol = "°C";
      } else { // Fahrenheit
          tempValue = Math.round(celsiusToFahrenheit(celsius));
          unitSymbol = "°F";
      }
      return { temp: tempValue, unit: unitSymbol};
    }

    _checkValidGpuDevice() {
        const gpus = listGpus().flat();

        if (!gpus.includes(this._gpuDevice)) {
            this._gpuDevice = gpus[0];
        }
    }

  _updateMonitor() {
    // Only update if the overlay is visible
    if (!this._overlay.visible) {
      return false;
    }

    this._cpuUsageLabel.set_text(this._getCpuUsage() + "%");
    const temp = this._getCpuTemperature();

    if (this._gtopAvailable && this._hwmonPath) {
      this._cpuTempLabel.set_text(temp.temp + temp.unit);
    } else if (!this._gtopAvailable) {
      this._cpuTempLabel.set_text(_("GTop missing, install 'libgtop' for temperature"));
      this._cpuUsageLabel.set_text(""); //Dont show anything here when GTop is not available
    } else if (!this._hwmonPath) {
      this._cpuTempLabel.set_text(_("Temperature sensor not found"));
    }

    if (this._gpuMonitoring) {
      this._gpuUsageLabel.set_text(this._getGpuUsage() + "%");
      const gpuTemp = this._getGpuTemperature();
      this._gpuTempLabel.set_text(gpuTemp.temp + gpuTemp.unit);
    } 

    return true;
  }

  _updateSettings(settings) {
    this._position = settings.get_string('cpu-addon-position');
    this._tempUnit = settings.get_string('cpu-temperature-unit'); // Get unit from settings
    this._gpuDevice = settings.get_string('gpu-device');
    this._gpuMonitoring = settings.get_boolean('gpu-monitoring');

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
    if (this._cpuTempLabel) {
        this._cpuContainer.remove_child(this._cpuTempLabel);
        this._cpuTempLabel.destroy();
        this._cpuTempLabel = null;
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

