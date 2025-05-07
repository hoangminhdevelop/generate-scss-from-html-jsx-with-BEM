// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

interface SASSObjectItem {
  parent: string;
  children: SASSObjectItem[];
}

interface ISASSObject {
  [block: string]: SASSObjectItem;
}

// Matches class or className attributes in HTML/JSX and captures their values
// Examples: class="header" or className="button primary"
const CLASS_NAME_REGEX = /class(?:Name)?=["']([^"']+)["']/g;

// Extracts the Block part of BEM class naming
// Matches alphanumeric characters with optional hyphens at the beginning of a string
// Example from "header__title--large": captures "header"
const BLOCK_REGEX = /(^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)/;

// Extracts the Element part of BEM class naming (after double underscore)
// Example from "header__title--large": captures "__title"
const ELEMENT_REGEX = /__([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)/;

// Extracts the Modifier part of BEM class naming (after double hyphen at the end)
// Example from "header__title--large": captures "--large"
const MODIFIER_REGEX = /--([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)$/;

/**
 * Extracts all class names from a given HTML string.
 *
 * This function uses a regular expression to find all occurrences of class attributes
 * in the provided HTML string and returns an array of individual class names.
 *
 * @param htmlString - The HTML string to extract class names from.
 * @returns An array of class names found in the HTML string. If no class names are found, returns an empty array.
 */
function getAllClassName(htmlString: string) {
  const matches = htmlString.matchAll(CLASS_NAME_REGEX);
  return Array.from(matches).flatMap((match) => match[1].split(" "));
}

/**
 * Splits a class name string into its BEM (Block-Element-Modifier) components.
 *
 * @param classString - The class name string to be parsed.
 * @returns A tuple containing three elements:
 * - The block name as a string, or `null` if no block is found.
 * - The element name as a string, or `null` if no element is found.
 * - The modifier name as a string, or `null` if no modifier is found.
 */
function splitClassNameByBEMRule(classString: string) {
  const block = classString.match(BLOCK_REGEX);
  const element = classString.match(ELEMENT_REGEX);
  const modifier = classString.match(MODIFIER_REGEX);

  if (!block) {
    return [null, null, null];
  }

  return [block[0], element?.[0] || null, modifier?.[0] || null];
}

// Sort children of each block - modifiers first, then elements
function sortSASSObjectChildren(children: SASSObjectItem[]): SASSObjectItem[] {
  return [...children].sort((a, b) => {
    const aIsModifier = a.parent.startsWith("--");
    const bIsModifier = b.parent.startsWith("--");

    // Modifiers come before elements
    if (aIsModifier && !bIsModifier) {
      return -1;
    }
    if (!aIsModifier && bIsModifier) {
      return 1;
    }

    // Alphabetical sorting within the same type
    return a.parent.localeCompare(b.parent);
  });
}

/**
 * Extracts a structured SCSS object representation from an array of class names
 * following the BEM (Block-Element-Modifier) naming convention.
 *
 * @param classNames - An array of class names to process.
 * @returns A structured SCSS object (`ISASSObject`) where each block, element,
 *          and modifier is organized hierarchically.
 *
 * The function performs the following steps:
 * - Splits each class name into its BEM components (block, element, modifier).
 * - Skips class names that do not have a valid block or have incorrect syntax.
 * - Creates a new block in the SCSS object if it does not already exist.
 * - Adds elements and modifiers to their respective blocks or elements.
 * - Ensures no duplicate elements or modifiers are added.
 * - Sorts the children of each block for consistent output.
 *
 * Example Input:
 * ```typescript
 * const classNames = ['block', 'block__element', 'block--modifier', 'block__element--modifier'];
 * ```
 *
 * Example Output:
 * ```typescript
 * {
 *   block: {
 *     parent: 'block',
 *     children: [
 *       {
 *         parent: 'element',
 *         children: [
 *           {
 *             parent: 'modifier',
 *             children: []
 *           }
 *         ]
 *       },
 *       {
 *         parent: 'modifier',
 *         children: []
 *       }
 *     ]
 *   }
 * }
 * ```
 */
function extractSCSS(classNames: string[]) {
  const SASSObject: ISASSObject = {};

  for (const className of classNames) {
    const [block, element, modifier] = splitClassNameByBEMRule(className);
    // Skip classname if it don't have block or it has wrong syntax
    if (!block) {
      continue;
    }
    const alreadyBlock = SASSObject[block];

    // Create a new block if it not existed
    if (!alreadyBlock) {
      SASSObject[block] = { parent: block, children: [] };
    }

    // Skip if not found element and modifier in class
    if (!element && !modifier) {
      continue;
    }

    if (element) {
      // fine
      const alreadyElement = alreadyBlock.children.find(
        (child) => child.parent === element
      );

      if (!alreadyElement) {
        alreadyBlock.children.push({
          parent: element,
          children: [],
        });
      }
    }

    if (modifier && element) {
      const alreadyElement = alreadyBlock.children.find(
        (child) => child.parent === element
      );
      const existedElementModifier = alreadyElement?.children?.some(
        ({ parent }) => parent === modifier
      );

      if (existedElementModifier) {
        continue;
      }

      alreadyElement?.children.push({
        parent: modifier,
        children: [],
      });
    }

    if (modifier && !element) {
      const existedBlockModifier = alreadyBlock?.children?.some(
        ({ parent }) => parent === modifier
      );

      if (existedBlockModifier) {
        continue;
      }

      alreadyBlock.children.push({
        parent: modifier,
        children: [],
      });
    }
  }

  for (const blockKey in SASSObject) {
    SASSObject[blockKey].children = sortSASSObjectChildren(
      SASSObject[blockKey].children
    );
  }
  return SASSObject;
}

/**
 * Converts a hierarchical SASS object structure into a SCSS string representation
 * using BEM-style selectors.
 *
 * @param obj - The root SASS object item to be converted. It contains the parent
 *              selector and its children.
 * @param parentSelector - The parent selector string to prepend to the current
 *                         selector. Defaults to an empty string.
 * @param indentLevel - The current level of indentation for the SCSS output.
 *                      Defaults to 0.
 * @returns A string containing the SCSS representation of the given SASS object.
 */
function parseToSCSS(
  obj: SASSObjectItem,
  parentSelector = "",
  indentLevel = 0
) {
  let scss = "";

  // Construct the current selector based on BEM conventions
  const currentSelector = !parentSelector
    ? `.${obj.parent}` // Top-level block
    : `&${obj.parent}`; // Nested element or modifier

  // Add indentation
  const indent = "\t".repeat(indentLevel);

  // Add the current selector
  scss += `${indent}${currentSelector} {\n`;

  // Add a placeholder comment for properties with proper indentation
  scss += `${indent}  \n`;

  // Recursively add child selectors with increased indentation
  for (const child of obj.children) {
    scss += parseToSCSS(child, currentSelector, indentLevel + 1);
  }

  // Close the current selector block
  scss += `${indent}}\n`;

  // Add extra newline between top-level blocks only
  if (indentLevel === 0) {
    scss += "\n";
  }

  return scss;
}

/**
 * Generates a SCSS string representation from a given SASS object.
 *
 * @param sassObject - An object representing the SASS structure, where each key corresponds
 * to a block and its associated styles.
 * @returns A string containing the SCSS representation of the provided SASS object.
 */
const generateSCSS = (sassObject: ISASSObject) => {
  let result = "";
  for (const block of Object.values(sassObject)) {
    result += parseToSCSS(block);
  }
  return result;
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "generate-sass-from-html-jsx.copySass",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        // Get the selected text
        const selectedText = document.getText(selection);

        const classNames = getAllClassName(selectedText);

        const scssObject = extractSCSS(classNames);
        vscode.env.clipboard.writeText(generateSCSS(scssObject));
        vscode.window.showInformationMessage("Sass content copied");
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
