import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

function isExported(s: ts.Statement) {
  const anyS: any = s
}

// collect all exported function names and their line numbers
function buildFunctionIndexForFile(
  filePath: string,
  pushResult: (identifier: string, lineNr: number) => void,
) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    fs.readFileSync(filePath).toString('utf-8'),
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TS,
  )

  sourceFile.statements.forEach((s: any) => {
    if (
      s.kind !== ts.SyntaxKind.FunctionDeclaration &&
      s.kind !== ts.SyntaxKind.InterfaceDeclaration &&
      s.kind !== ts.SyntaxKind.ClassDeclaration &&
      s.kind !== ts.SyntaxKind.TypeAliasDeclaration
    ) {
      return
    }

    const decl:
      | ts.FunctionDeclaration
      | ts.InterfaceDeclaration
      | ts.ClassDeclaration
      | ts.TypeAliasDeclaration = s

    if (decl.modifiers?.[0]?.kind !== ts.SyntaxKind.ExportKeyword) {
      return
    }

    const name = `${decl.name?.escapedText}`

    // ts line numbers are 0-based, githubs are 1-based
    const lineNr =
      sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1

    pushResult(name, lineNr)
  })
}

function buildFunctionIndex(directory: string) {
  const files = fs.readdirSync(directory)

  const functions = new Map<string, { lineNr: number; fileName: string }>()

  files.forEach((fileName) => {
    buildFunctionIndexForFile(
      path.join(directory, fileName),
      (identifier, lineNr) => {
        functions.set(identifier, { fileName, lineNr })
      },
    )
  })

  return functions
}

// extend every occurence of `<runtype>` with a link to the declaration
function createReadmeReferenceLinks() {
  const sourcePath = path.join(__dirname, '../src')
  const readmePath = path.join(__dirname, '../README.md')

  const functionIndex = buildFunctionIndex(sourcePath)
  const readme = fs.readFileSync(readmePath).toString('utf-8')

  const readmeWithLinks = readme
    // update existing links
    .replace(/\[`\w+`\]\(src\/\w+\.ts#L\d+\)/g, (match, g1) => {
      const functionName = match.slice(2, match.indexOf('`', 2))
      const entry = functionIndex.get(functionName)

      if (!entry) {
        console.log('no entry found for existing link', functionName, match)

        return match
      }

      return `[\`${functionName}\`](src/${entry.fileName}#L${entry.lineNr})`
    })
    // create new links
    .replace(/[^\[]`\w+`/g, (match) => {
      const prefixChar = match[0]
      const functionName = match.slice(2, -1)
      const entry = functionIndex.get(functionName)

      if (!entry) {
        console.log('no entry found for', functionName, match)

        return match
      }

      return `${prefixChar}[\`${functionName}\`](src/${entry.fileName}#L${entry.lineNr})`
    })

  fs.writeFileSync(readmePath, readmeWithLinks)
}

createReadmeReferenceLinks()
