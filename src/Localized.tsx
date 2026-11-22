import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import { translate, type Language } from './i18n'

function localizeNode(node: ReactNode, language: Language): ReactNode {
  if (typeof node === 'string') return translate(language, node)
  if (Array.isArray(node)) return Children.map(node, (child) => localizeNode(child, language))
  if (!isValidElement<{ children?: ReactNode; [key: string]: unknown }>(node)) return node

  const props: Record<string, unknown> = {}
  for (const name of ['aria-label', 'title', 'placeholder']) {
    const value = node.props[name]
    if (typeof value === 'string') props[name] = translate(language, value)
  }
  return cloneElement(node, props, localizeNode(node.props.children, language))
}

export default function Localized({ language, children }: { language: Language; children: ReactNode }) {
  return <>{localizeNode(children, language)}</>
}
