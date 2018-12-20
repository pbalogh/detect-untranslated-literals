// recursively checks for un-internationalized string content in html nodes

// requires flow-parser:
// npm install --save flow-parser

// Usage: node detectUntranslatedLiterals.js /path/to/some/directory

// based on:
// https://github.com/RReverser/esprima-fb/blob/fb-harmony/examples/detectnestedternary.js

const parser = require('flow-parser');

const fs = require('fs');
const _ = require('lodash');
const dirname = process.argv[2];


const filenameRegex = /.*\.js$/;
const testFileRegex = /.*\.spec.js$/;

const parseOptions = {
    esproposal_class_instance_fields: true,
    esproposal_class_static_fields: true,
    esproposal_export_star_as: true,
};

const emptyTextRegex = /[^\s\d]/;

// Executes visitor on the object and its children (recursively).
function traverse(object, visitor) {
    let key;
    let child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

// http://stackoverflow.com/q/5827612/
function walk(dir, done) {
    let results = [];
    fs.readdir(dir, (err, list) => {
        if (err) {
            return done(err);
        }
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) {
                return done(null, results);
            }
            file = `${dir}/${file}`;
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    walk(file, (err, res) => {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        }());
    });
}

walk(dirname, (err, results) => {
    if (err) {
        console.log('Error', err);
        return;
    }

    results.forEach(filename => {
        let shortname;
        let first;
        let content;
        let syntax;

        shortname = filename;
        first = true;

        if (shortname.substr(0, dirname.length) === dirname) {
            shortname = shortname.substr(dirname.length + 1, shortname.length);
        }

        function report(node, problem) {
            if (first === true) {
                console.log(`${shortname}: `);
                first = false;
            }
            console.log('  Line', node.loc.start.line, ':', problem);
        }


        if (!filenameRegex.test(filename)) return;
        if (testFileRegex.test(filename)) return;

        try {
            content = fs.readFileSync(filename, 'utf-8');
            // console.log('about to parse file ', filename);
            syntax = parser.parse(content, parseOptions);

            traverse(syntax, node => {
                const badTags = ['div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5'];
                if (node.type === 'JSXElement') {
                    // console.log('Found node ', node);
                    // console.log('node is ', node);
                    const openingTag = node.openingElement;
                    // console.log('Found tag ', openingTag);
                    if (openingTag.type === 'JSXOpeningElement') {
                        // console.log('Found tag ', openingTag.type);
                        if (_.includes(badTags, openingTag.name.name)) {
                            if (node.children.length > 0) {
                                const firstKid = node.children[0];
                                if (firstKid.type === 'JSXText') {
                                    if (firstKid.value) {
                                        if (emptyTextRegex.test(firstKid.value)) {
                                            report(firstKid, `Untranslated literal: ${firstKid.value}`);
                                            // console.log('FOUND AN UNTRANSLATED LITERAL: ', firstKid);
                                            // console.log('In file ', filename);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.log('Unable to parse file ', filename);
            console.log('error ', e);
        }
    });
});

