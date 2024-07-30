# Generate SCSS from HTML/JSX

## Overview

The **Generate SCSS from HTML/JSX** VS Code extension provides functionality to automatically generate SCSS styles based on class names found in your HTML or JSX code. This extension helps streamline the process of creating SCSS structures by extracting class names and converting them into a hierarchical SCSS format.

## Features

- **Extract Class Names**: Parses the selected text in your editor to find class names following the BEM (Block, Element, Modifier) naming convention.
- **Generate SCSS**: Converts the extracted class names into SCSS syntax based on the hierarchical structure.
- **Copy to Clipboard**: Automatically copies the generated SCSS code to your clipboard for easy pasting into your stylesheets.

## Installation

1. Open VS Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for `generate-sass-from-html-jsx`.
4. Click `Install` to install the extension.

Alternatively, you can install the extension directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Generate-JSX-HTML-to-BEM-SCSS.generate-sass-from-html-jsx).

## Usage

1. **Open your HTML or JSX file** in VS Code.
2. **Select the text** containing the class names you want to convert to SCSS.
3. **Execute the Command**:
   - Open the Command Palette by pressing `Ctrl+Shift+P` or `Command+Shift+P`.
   - Search for and select `Copy SASS content`.

The SCSS code will be generated based on the selected text and copied to your clipboard. You will see a notification confirming that the Sass content has been copied.

## Source code
[https://github.com/hoangminhdevelop/generate-scss-from-html-jsx-with-BEM/blob/main/src/extension.ts](https://github.com/hoangminhdevelop/generate-scss-from-html-jsx-with-BEM/blob/main/src/extension.ts)



