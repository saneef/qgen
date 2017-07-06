![qgen logo](https://cdn.rawgit.com/alarisprime/qgen/master/media/qgen-logo.svg)

[![Build Status](https://travis-ci.org/alarisprime/qgen.svg?branch=master)](https://travis-ci.org/alarisprime/qgen) [![Greenkeeper badge](https://badges.greenkeeper.io/alarisprime/qgen.svg)](https://greenkeeper.io/)

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

File `./qgen-templates/__title__.jsx`

```jsx
import React, { PropTypes } from 'react';

const {{title}} = () => (<div>{{title}}</div>);

export default {{title}};

```

File `./qgen-templates/__title__.css`

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

### Using variables for filenames

You can use the data values to generate filename. Eg. The data from the argulment `--page-title` can be used to render a filename `__pageTitle__.md`. Eg. `--page-title=today` can be used to render `__pageTitle__.md → today.md`. Data variables can be used only for files kept inside a folder. Read more on it under [Template with multiple files](#template-with-multiple-files).

## ‘qgen.json’, The configfile

You can use `qgen.json` to set template directory, default destination, default argument values, etc.

```javascript
{
	"directory": "./my-templates", // Default: "./qgen-templates"
	"dest": "./pages", // Destination for all templates. Default: "./"
	"templates": { // Default: []
		"blog.md": { // These configuration will be passed while compiling template 'blog.md'
			"title": "A Fresh Title",
			"slug": "a-fresh-title",
			"dest": "./blog-pages" // Overrides the 'dest' for this template. Default: undefined
		}
	}
}
```

## Contributing

This package uses [semantic-release](https://github.com/semantic-release/semantic-release) for automatic releases. For it to work, make sure the commit messages are in [this format](https://github.com/semantic-release/semantic-release#default-commit-message-format).

## Tips & Tricks

### Want to set a variable to today’s date?

Make use of the system `date` shell command.

```bash
$ qgen blog.md --filename=`date "+%Y-%m-%d"`
```

## Features to be implemented

- [ ] Use date and other dynamic data for variables. For now, read [Tips & Tricks](#tips--tricks)
- [ ] ability to add plugin [helpers](http://handlebarsjs.com/expressions.html#helpers)

## License

MIT © [Alaris Prime](https://alarisprime.com/), LLC
