import { hexToRgb, Color, Solver } from './_filter-calculator';

// Return a custom css file with the desired accent
export function get(req, res, next) {
    let { color } = req.params;
    let { logo } = req.query;

    let result;
    if (logo) {
        const rgb = hexToRgb(logo);
        if (rgb && rgb.length === 3) {
            const logoColor = new Color(rgb[0], rgb[1], rgb[2]);
            const solver = new Solver(logoColor);
            result = solver.solve();
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/css'
    });

    res.end(`
header #logo {
    ${result ? result.filter : ''}
}
        :root{--accent: #${color}}`);
}
