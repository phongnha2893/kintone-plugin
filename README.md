# kintone-plugin

plugin packaging cmd:


# Confirm the directory structure before execution
$ tree
.
└── src
    ├── css
    │   ├── 51-modern-default.css
    │   ├── config.css
    │   └── desktop.css
    ├── html
    │   └── config.html
    ├── image
    │   └── icon.png
    ├── js
    │   ├── config.js
    │   └── desktop.js
    └── manifest.json

$ npm install -g @kintone/plugin-packer
$ cd sample_project
$ kintone-plugin-packer src


Optional features

Packaging for the second time:
$ kintone-plugin-packer --ppk plugin_key src

Specifying the output directory and file name of the zip file:
$ kintone-plugin-packer --put ../zip_dir/test.zip src

File monitoring
$ kintone-plugin-packer --watch src

Web version
https://plugin-packer.kintone.dev/

