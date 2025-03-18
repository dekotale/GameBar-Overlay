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

const findHwmon = () => {
    const drivers = ['zenpower', 'k10temp'];
    let hwmonPath = null;
    try {
        const hwmonDirs = listDir("/sys/class/hwmon/");
        if (!hwmonDirs) {
            return null;
        }
        for (const hwmonDir of hwmonDirs) {
            const hwmonBasePath = "/sys/class/hwmon/" + hwmonDir.get_name();
            const driverName = readFile(hwmonBasePath + "/name");
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

// Celsius to Fahrenheit conversion
const celsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
};

export { getPositionStyle, set_padding_setting, readFile, listDir, findHwmon, celsiusToFahrenheit };