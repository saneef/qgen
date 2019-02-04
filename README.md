![qgen logo](https://cdn.rawgit.com/alarisprime/qgen/master/media/qgen-logo.svg)

[![Build Status](https://travis-ci.org/alarisprime/qgen.svg?branch=master)](https://travis-ci.org/alarisprime/qgen) [![Greenkeeper badge](https://badges.greenkeeper.io/alarisprime/qgen.svg)](https://greenkeeper.io/) [![Known Vulnerabilities](https://snyk.io/test/github/alarisprime/qgen/badge.svg?targetFile=package.json)](https://snyk.io/test/github/alarisprime/qgen?targetFile=package.json)

qgen generates files and folders from templates. It can generate folder structure as well as file contents.

Some scenarios where qgen can come handy for you:

- Generate the file for your next Jekyll blog post.
- Generate files for the new React component in your current project.

![using qgen](/media/qgen-example-usge.gif)

qgen is inspired by envato-tuts+’s [Structurer.app](https://code.tutsplus.com/articles/free-mac-utility-app-structurer--net-17153).

## Install

	$ npm install -g qgen

## Usage

```bash
Usage
	$ qgen <template name> [dest] [arguments] [options]

Options
	--directory=<dir>	Templates directory # Default: ./gqen-templates
	--config=<path>	Path to the JSON config file # Default: ./qgen.json

Examples
	$ qgen post # generates the post template in the current folder
	$ qgen post ./pages # generates the post template inside ./pages
	$ qgen post ./pages --page-title "Hello World" # generates the post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine
```

In your project folder (where packages.json is present), keep your templates files inside `qgen-templates`.

## Templates

qgen uses [Handlebars](http://handlebarsjs.com) to render the template files.

The data arguments passed to CLI will be made available inside Handlebars templates as camel case context variables. Eg `--page-title` can be accessed in the template as `pageTitle`.

### Example

#### Template with a single file

File `./qgen-templates/post.md`

```markdown
---
title: {{title}}
slug: {{slug}}
---

```

```bash
$ qgen post.md ./page --title "Hello World" --slug "hello-world"
```

Generated file `./page/post.md`
```markdown
---
title: Hello World
slug: hello-world
---

```

#### Template with multiple files

Keep all the files inside `./qgen-templates/my-component`, where `my-component` will be the name of the template.

File `./qgen-templates/{{title}}.jsx`

```jsx
import React, { PropTypes } from 'react';

const {{title}} = () => (<div>{{title}}</div>);

export default {{title}};

```

File `./qgen-templates/{{title}}.css`

```css
.{{className}} {
	clear: both;
}

```

```bash
$ qgen my-component ./Dummy --title "Dummy" --class-name "dummy"
```

Generated file `./Dummy/Dummy.jsx`
```jsx
import React, { PropTypes } from 'react';

const Dummy = () => (<div>Dummy</div>);

export default Dummy;

```

Generated file `./Dummy/Dummy.css`
```css
.dummy {
	clear: both;
}

```

### Templating filenames

You can use Handlebars templates to generate the filenames too.

_Example:_ `{{pageTitle}}.md` file will be renamed to `today.md`, if you pass argument `--page-title today` while using qgen.

**Note:** Templates for filenames can only be used for files kept inside a folder. Read more on it under [Template with multiple files](#template-with-multiple-files).

## ‘qgen.json’, The configfile

You can use `qgen.json` to set template directory, default destination, default argument values, etc.

```javascript
{
	"directory": "./my-templates", // Default: "./qgen-templates"
	"dest": "./pages", // Destination for all templates. Default: "./"
	"helpers": "./handlebar-helpers.js", // Path to the Handlebars helpers. Default: undefined
	"postHooks": { // Path to the post hook script. Default: undefined
		"append.csv": "./qgen-hooks/append.js"
	},
	"templates": { // Default: {}
		"blog.md": { // These configuration will be passed while compiling template 'blog.md'
			"title": "A Fresh Title",
			"slug": "a-fresh-title",
			"dest": "./blog-pages" // Overrides the 'dest' for this template. Default: undefined
		}
	}
}
```

## Using Handlebars Custom Helpers

You can load custom Handlebars helpers to qgen’s Handlerbars rendering engine. Pass the path to the file which exports the helper functions to the option `helpers`, either through the CLI param or, through config file. Here is a [sample file](./test/fixtures/render-with-helper/src/qgen-helpers.js) which exports two custom helpers.

## Using Post Hook Script

You can merge existing file with rendered content. Pass the pair of path to the template file and hook script to the option `postHooks` like below.

```javascript
{
  "postHooks": {
    "csv-stuff/append.csv": "./qgen-hooks/append.js"
  }
}
```

This post hook script (`./qgen-hooks/append.js`) will be applied when the template (`csv-stuff/append.csv`) is in rendering to `dest/append.csv`.

Here is a [sample file](./test/fixtures/post-hook/src/qgen-hooks/append.js) which appends rendered content into original content.

## Tips & Tricks

### Want to set a variable to today’s date?

Make use of the system `date` shell command.

```bash
$ qgen blog.md --filename=`date "+%Y-%m-%d"`
```

## License

MIT © [Alaris Prime](https://alarisprime.com/), LLC
