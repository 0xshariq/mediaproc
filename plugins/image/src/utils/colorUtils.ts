// Utility to normalize color input for sharp
// Accepts hex, rgb(a), named, and ascii color codes

export function normalizeColor(input: string, colorFormat: string): string | { r: number; g: number; b: number; alpha?: number } {
    if (!input) input = '#000000';
    const namedColors: Record<string, string> = {
        red: '#ff0000', green: '#00ff00', blue: '#0000ff', black: '#000000', white: '#ffffff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff', gray: '#808080', grey: '#808080', orange: '#ffa500', gold: '#ffd700', silver: '#c0c0c0', purple: '#800080', pink: '#ffc0cb', brown: '#a52a2a', transparent: '#00000000', // add more as needed
    };

    let hex: string | null = null;
    let rgb: { r: number; g: number; b: number; alpha?: number } | null = null;

    // Named color
    if (namedColors[input.toLowerCase()]) {
        hex = namedColors[input.toLowerCase()];
        rgb = hexToRgb(hex);
    }
    // Hex (#fff, #ffffff)
    else if (/^#([a-fA-F0-9]{3}){1,2}$/.test(input)) {
        hex = input;
        rgb = hexToRgb(hex);
    }
    // Hex (#ffffffff)
    else if (/^#([a-fA-F0-9]{4,8})$/.test(input)) {
        hex = input;
        rgb = hexToRgb(hex.substring(0, 7));
    }
    // RGB/RGBA
    else {
        const rgbMatch = input.match(/^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d*\.?\d+))?\)$/);
        if (rgbMatch) {
            const [, r, g, b, a] = rgbMatch;
            rgb = { r: Number(r), g: Number(g), b: Number(b) };
            if (a !== undefined) rgb.alpha = Number(a);
            hex = '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        } else {
            // ASCII code (e.g., '27,255,0' or '27,255,0,0.5')
            const asciiMatch = input.match(/^(\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(\d*\.?\d+))?$/);
            if (asciiMatch) {
                const [, r, g, b, a] = asciiMatch;
                rgb = { r: Number(r), g: Number(g), b: Number(b) };
                if (a !== undefined) rgb.alpha = Number(a);
                hex = '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
            }
        }
    }

    // Helper to parse hex to RGB
    function hexToRgb(hex: string) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    // Output based on colorFormat
    switch (colorFormat) {
        case 'hex':
            return hex || input;
        case 'rgb':
            if (rgb) {
                if (rgb.alpha !== undefined) {
                    return `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.alpha})`;
                }
                return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            }
            return input;
        case 'auto':
        default:
            // If alpha present, prefer rgba, else hex
            if (rgb && rgb.alpha !== undefined) {
                return `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.alpha})`;
            }
            return hex || input;
    }
}
