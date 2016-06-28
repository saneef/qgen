# qGen

[![Build Status](https://travis-ci.org/saneef/qgen.svg?branch=master)](https://travis-ci.org/saneef/qgen)

qGen generates files and folders from templates. It can generate folder structre as well as file contents.

Some scenarios where qGen can come handy for you:

- Generate the file for you next Jekyll blog post.
- Generate files for a new React component in your current project

## Install

	$ npm install -g qgen

## Usage

```bash
Generate files from templates

Usage
	$ qgen <template name> [dest] [arguments] [options]

Options
	--directory=<dir>	Templates directory # Default: ./gqen-templates

Examples
	$ qgen post # generates the post template in the current folder
	$ qgen post ./pages # generates the post template inside ./pages
	$ qgen post ./pages --page-title "Hello World" # generates the post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine
```

In your project folder (where packages.json is present), keep your templates files inside `qgen-templates`.

### Example

Template file `./qgen-templates/post.md`
```
---
title: {{title}}
slug: {{slug}}
---

```

```
$ qgen post.md ./page --title "Hello World" --slug "hello-world"
```

Generate file `./page/post.md`
```
---
title: Hello World
slug: hello-world
---

```

qGen uses [handlebars](http://handlebarsjs.com) to render the template files.

## License
MIT © [Saneef Ansari](https://saneef.com)
