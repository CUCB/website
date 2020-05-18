import fs from 'fs';
import showdown from 'showdown';

export async function get(req, res, next) {
    // the `slug` parameter is available because
    // this file is called [slug].json.js
    const { slug } = req.params;

    let cacheValid = false;

    try {
        const cachedStats = fs.statSync(`cached_content/faqs/${slug}.html`);
        const mdStats = fs.statSync(`content/faqs/${slug}.md`);
        cacheValid = cachedStats.mtime > mdStats.mtime;
    } catch (e) {
        // Probably couldn't find cached version, this is fine
    }

    let html;

    if (!cacheValid) {
        let markdown;
        try {
            markdown = fs.readFileSync(`content/faqs/${slug}.md`, 'utf-8');
        } catch (e) {
            res.writeHead(404, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
                message: 'Not found'
            }));
            return;
        }

        const converter = new showdown.Converter();
        html = converter.makeHtml(markdown);
        try {
            fs.mkdirSync(`cached_content`);
            fs.mkdirSync(`cached_content/faqs`);
        } catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
        fs.writeFileSync(`cached_content/faqs/${slug}.html`, html, { flag: 'w+' });
    } else {
        html = fs.readFileSync(`cached_content/faqs/${slug}.html`, 'utf-8');
    }

    // Set some permissions for easier/more reliable testing
    if (process.env.NODE_ENV === 'development') {
        fs.chmodSync(`cached_content`, '777');
        fs.chmodSync(`cached_content/faqs`, '777');
        fs.chmodSync(`cached_content/faqs/${slug}.html`, '666');
    }

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({ content: html }));
}
