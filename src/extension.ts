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

const REGEX = {
  classNames: /class(?:Name)?=["']([^"']+)["']/g,
  block: /(^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)/,
  element: /__([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)/,
  modify: /--([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)$/,
};

function getAllClassName(htmlString: string) {
  const matches = htmlString.matchAll(REGEX.classNames);
  return Array.from(matches).flatMap((match) => match[1].split(" "));
}

function splitClassNameByBEMRule(classString: string) {
  const block = classString.match(REGEX.block);
  const element = classString.match(REGEX.element);
  const modify = classString.match(REGEX.modify);
  if (!block) {
    return [null, null, null];
  }
  return [block[0], element?.[0] || null, modify?.[0] || null];
}

function extractSCSS(classNames: string[]) {
  const SASSObject: ISASSObject = {};

  for (const className of classNames) {
    const [block, element, modify] = splitClassNameByBEMRule(className);
    if (!block) {
      continue;
    }
    const alreadyBlock = SASSObject[block];

    // Init new block
    if (!alreadyBlock) {
      SASSObject[block] = { parent: block, children: [] };
    }

    if (!element && !modify) {
      continue;
    }

    if (element) {
      const alreadyBlock = SASSObject[block];
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
    if (modify) {
      const alreadyBlock = SASSObject[block];
      if (element) {
        const alreadyElement = alreadyBlock.children.find(
          (child) => child.parent === element
        );
        alreadyElement?.children.push({
          parent: modify,
          children: [],
        });
      } else {
        alreadyBlock.children.push({
          parent: modify,
          children: [],
        });
      }
    }
  }

  return SASSObject;
}

function parseToSCSS(obj: SASSObjectItem, parentSelector = "") {
  let scss = "";

  // Construct the current selector
  const currentSelector = !parentSelector ? `.${obj.parent}` : `&${obj.parent}`;

  // Add the current selector
  scss += `${currentSelector} {\n`;

  // Recursively add child selectors
  for (const child of obj.children) {
    scss += parseToSCSS(child, currentSelector);
  }

  // Close the current selector block
  scss += `}\n`;

  return scss;
}

const generateSCSS = (sassObject: ISASSObject) => {
  console.log("sassObject", sassObject);
  let result = "";
  for (const block of Object.values(sassObject)) {
    result += parseToSCSS(block);
  }
  return result;
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "generate-sass-from-html-jsx" is now active!'
  );

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
