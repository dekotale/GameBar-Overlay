import Gio from 'gi://Gio';

let padding_setting = 50;

const set_padding_setting = (padding_value) => {
    padding_setting = padding_value
};

const getPositionStyle = (primaryMonitor, position, element) => {
    const monitorWidth = primaryMonitor.width;
    const monitorHeight = primaryMonitor.height;

    // Get an initial
    const elementWidth = element.get_preferred_size()[2] + 5;
    const elementHeight = element.get_preferred_size()[3] + 5;

    switch (position) {
        case 'Top Left':
            return { x: 1 + padding_setting, y: 0 + padding_setting }; //BUG:: 0,0 make element display at the center of screen.
        case 'Top Center':
            return { x: (monitorWidth - elementWidth) / 2, y: 0 + padding_setting };
        case 'Top Right':
            return { x: (monitorWidth - elementWidth) - padding_setting, y: 0 + padding_setting };
        case 'Center Left':
            return { x: 0 + padding_setting, y: (monitorHeight - elementHeight) / 2 };
        case 'Center Center':
            return { x: (monitorWidth - elementWidth) / 2, y: (monitorHeight - elementHeight) / 2 };
        case 'Center Right':
            return { x: (monitorWidth - elementWidth) - padding_setting, y: (monitorHeight - elementHeight) / 2 };
        case 'Bottom Left':
            return { x: 0 + padding_setting, y: (monitorHeight - elementHeight) - padding_setting };
        case 'Bottom Center':
            return { x: (monitorWidth - elementWidth) / 2, y: (monitorHeight - elementHeight) - padding_setting };
        case 'Bottom Right':
            return { x: (monitorWidth - elementWidth) - padding_setting, y: (monitorHeight - elementHeight) - padding_setting };
        default:
            return { x: 1 + padding_setting, y: 0 + padding_setting };
    }
};

const readFile = (path) => {
    try {
        const file = Gio.File.new_for_path(path);
        const [success, contents] = file.load_contents(null);
        if (!success) {
            throw new Error(`Failed to read file: ${path}`);
        }
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(contents).trim();
    } catch (error) {
        return null; // Return null to indicate failure
    }
};

const listDir = (path) => {
    try {
        const dir = Gio.File.new_for_path(path);
        const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

        let files = [];
        let fileInfo;

        while ((fileInfo = enumerator.next_file(null)) !== null) {
            files.push(fileInfo);
        }
        return files;
    } catch (error) {
        return [];  // Return an empty array to indicate failure.
    }
};

// Find the correct hwmon CPU temperature sensor if supportedf by the driver.
const findCpuHwmon = () => {
    const drivers = ['zenpower', 'k10temp', 'coretemp'];
    let hwmonPath = null;
    try {
        const hwmonDirs = listDir('/sys/class/hwmon/');
        if (!hwmonDirs) {
            return null;
        }
        for (const hwmonDir of hwmonDirs) {
            const hwmonBasePath = '/sys/class/hwmon/' + hwmonDir.get_name();
            const driverName = readFile(hwmonBasePath + '/name');
            if (driverName && drivers.includes(driverName)) {
                hwmonPath = hwmonBasePath + '/temp1_input';
                break;
            }
        }
    } catch (error) {
        return null; // Ensure hwmonPath is null if an error occurs.
    }
    return hwmonPath;
};

// Find the first hwmon for a GPU
const findFirstHwmon = (drm_id) => {
    const basePath = '/sys/class/drm/' + drm_id + "/device/hwmon"; // This directory can contain multiple hwmon interfaces.
    const hwmonList = listDir(basePath);
    const firstHwmon = hwmonList[0];
    return basePath + "/" + firstHwmon.get_name();
}

// Get the GPU driver name (eg. amdgpu/nvidia/i915/xe)
const getGpuDriver = (drm_id) => {
    // /sys/class/drm/card*/device/driver is a symlink to the kernel module and needs to be resolved.
    const path = '/sys/class/drm/' + drm_id + "/device/driver";
    const driverPath = Gio.File.new_for_path(path);
    const driverPathInfo = driverPath.query_info(
        'standard::symlink-target',
        Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
        null
    );

    const driverName = driverPathInfo.get_symlink_target().split('/').pop();
    return driverName;
}

// List all GPUs with supported drivers.
const listGpus = () => {
    const drivers = ['amdgpu', 'nvidia', 'i915', 'xe', 'nouveau'];
    const devices = [];

    const drmDevices = listDir('/sys/class/drm/');
    for (const device of drmDevices) {
        // Only enumerate card0, card1 etc...
        if (!/^card\d+$/.test(device.get_name())) {
            continue;
        }

        const driverName = getGpuDriver(device.get_name());
        if (drivers.includes(driverName)) {
            // example: ['card0', 'amdgpu']
            devices.push([device.get_name(), driverName])
            continue;
        }
    }
    return devices;
}

// Searches for the device string in the hwdata database.
const getGpuModel = (drm_id) => {
    const basePath = '/sys/class/drm/' + drm_id + "/device";
    const expectedVendorId = readFile(basePath + "/vendor").replace("0x", "");
    const expectedDeviceId = readFile(basePath + "/device").replace("0x", "");
    const hwdata = readFile("/usr/share/hwdata/pci.ids");
    
    let foundVendor = false;
    for (const line of hwdata.split("\n")) {
        if (line.startsWith('#')) continue;

        // Check if the vendor matches.
        if (/^[0-9a-fA-F]{4}/.test(line)) {
            const [vendorId] = line.trim().split(/\s+/);
            foundVendor = (vendorId === expectedVendorId);
        }

        // If vendor matches, check next lines for matching device id.
        else if (foundVendor && /^\t[0-9a-fA-F]{4}/.test(line)) {
            const [deviceId, ...name] = line.trim().split(/\s+/);
            if (deviceId.toLowerCase() === expectedDeviceId) {
                return name.join(' ').match(/\[(.*?)\]/)?.[1]; // Extract only the model name from the full string.
            }
        }
    }
    return "Unknown (" + getGpuDriver(drm_id) + ")";
}

// Celsius to Fahrenheit conversion
const celsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
};

export { getPositionStyle, set_padding_setting, readFile, listDir, findCpuHwmon, findFirstHwmon, getGpuDriver, listGpus, getGpuModel, celsiusToFahrenheit };
