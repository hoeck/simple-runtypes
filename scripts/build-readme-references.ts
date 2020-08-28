import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'

function isExported(s: ts.Statement) {
  const anyS: any = s
}

// collect all exported function names and their line numbers
function buildFunctionIndex(filePath: string) {
  const sourceFile = ts.createSourceFile(
    'test.ts',
    fs.readFileSync(filePath).toString('utf-8'),
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TS,
  )

  const functions = new Map<string, number>()

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

    functions.set(name, lineNr)
  })

  return functions
}

// extend every occurence of `<runtype>` with a link to the declaration
function createReadmeReferenceLinks() {
  const sourcePath = path.join(__dirname, '../src/index.ts')
  const readmePath = path.join(__dirname, '../README.md')

  const functionIndex = buildFunctionIndex(sourcePath)
  const readme = fs.readFileSync(readmePath).toString('utf-8')

  const readmeWithLinks = readme.replace(/`\w+`/g, (match) => {
    const functionName = match.slice(1, -1)
    const lineNr = functionIndex.get(functionName)

    if (lineNr === undefined) {
      console.log('no entry found for', match)

      return match
    }

    return `[${match}](src/index.ts#L${lineNr})`
  })

  fs.writeFileSync(readmePath, readmeWithLinks)
}

createReadmeReferenceLinks()
