import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const challengeLinkFiles = [
  'app/(main)/ctf/CTFClient.tsx',
  'components/ctf/ChallengeGrid.tsx',
  'app/(main)/ctf/stats/CTFStatsClient.tsx',
  'app/(main)/learn/[topic]/[lesson]/page.tsx',
  'app/(main)/teams/[slug]/page.tsx',
]

function findChallengeLinksWithoutPrefetch(filePath: string) {
  const sourceText = readFileSync(resolve(process.cwd(), filePath), 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const missingLines: number[] = []

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const isLink = ts.isIdentifier(node.tagName) && node.tagName.text === 'Link'
      const href = node.attributes.properties.find(
        (property): property is ts.JsxAttribute =>
          ts.isJsxAttribute(property) && property.name.getText(sourceFile) === 'href',
      )

      const expression = href?.initializer && ts.isJsxExpression(href.initializer)
        ? href.initializer.expression
        : undefined
      const isChallengeLink = expression && ts.isTemplateExpression(expression)
        && expression.head.text === '/ctf/'

      if (isLink && isChallengeLink) {
        const prefetch = node.attributes.properties.find(
          (property): property is ts.JsxAttribute =>
            ts.isJsxAttribute(property) && property.name.getText(sourceFile) === 'prefetch',
        )
        const isDisabled = prefetch?.initializer
          && ts.isJsxExpression(prefetch.initializer)
          && prefetch.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword

        if (!isDisabled) {
          missingLines.push(sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1)
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return missingLines
}

describe('CTF challenge link prefetching', () => {
  it.each(challengeLinkFiles)('disables direct challenge prefetches in %s', (filePath) => {
    expect(findChallengeLinksWithoutPrefetch(filePath)).toEqual([])
  })
})
