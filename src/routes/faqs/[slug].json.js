import fs from 'fs';
import path from 'path';
import showdown from 'showdown';

export async function get(req, res, next) {
    // the `slug` parameter is available because
    // this file is called [slug].json.js
    const { slug } = req.params;

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
    let html = converter.makeHtml(markdown);

    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify({ content: html }));
}
