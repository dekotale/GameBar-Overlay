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

export { getPositionStyle, set_padding_setting };