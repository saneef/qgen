# qGen

[![Build Status](https://travis-ci.org/alarisprime/qgen.svg?branch=master)](https://travis-ci.org/alarisprime/qgen)

qGen generates files and folders from templates. It can generate folder structre as well as file contents.

Some scenarios where qGen can come handy for you:

- Generate the file for you next Jekyll blog post.
- Generate files for a new React component in your current project

![](/media/qgen-example-usge.gif)

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

## qGen Templates

qGen uses [handlebars](http://handlebarsjs.com) to render the template files. So use handlebars syntax to write you generator files.

The data arguments passed to CLI will be converted in camel case and passed to the template rendering enging. Eg `--page-title` can be access in template using `pageTitle`.

You can also use the data values to generate filename. Eg. with data `--page-title` can be used to render a filename `__pageTitle__.md`. Eg. `--page-title=today` can be used to render `__pageTitle__.md → today.md`. **Note: Data variables can be used only for files kept inside a folder. Refer: [Template with multiple files](#template-with-multiple-files)**

### Example

#### Template of single file

Template file `./qgen-templates/post.md`, where `post.md` will be the name of the template.
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

Template folder `./qgen-templates/my-component`, where `my-component` will be the name of the template.

Template file `./qgen-templates/__title__.jsx`
```jsx
import React, { PropTypes } from 'react';

const {{title}} = () => (<div>{{title}}</div>);

export default {{title}};

```

Template file `./qgen-templates/__title__.css`
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

## ‘qgen.json’, The configfile

You can keep keep your configuration file, `gqen` with settings like template directory, default destination,…

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


## Tips & Tricks

### Want to set a variable to today’s date?

Make use of the system `date` command.

```bash
$ qgen blog.md --filename=`date "+%Y-%m-%d"`
```

## Feature to be implemented

- [x] variable in filenames
- [x] config file, to keep default values and paths
- [ ] Use date and other dynamic data for variables, for now refer [Tips & Tricks](#tips--tricks)
- [ ] ability to add plugin [helpers](https://handlebarsjs.com/expressions.html#helpers)

## License

MIT © Alaris Prime, LLC
