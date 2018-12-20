# detect-untranslated-literals
Search a React codebase for plaintext bypassing react-intl

Uses the flow-parser to traverse your codebase (start at a high-level directory) and examine all the JSX nodes for untranslated text.

npm i detect-untranslated-literals

Sample usage:

node detectUntranslatedLiterals.js /path/to/some/directory

Output will show any strings that are not being processed by react-intl along with filename and line number.

Based quite heavily on https://github.com/RReverser/esprima-fb/blob/fb-harmony/examples/detectnestedternary.js
