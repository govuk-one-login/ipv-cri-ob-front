import type { Wizard, WizardSessionSlice, WizardStepConfig, WizardSteps } from '@src/utils/wizard'

const nextStepsOf = (config: WizardStepConfig<WizardSessionSlice>): string[] => {
  if (config.next === undefined) return []
  return Array.isArray(config.next) ? config.next : [config.next]
}

const blue = (s: string): string => `\x1b[0m\x1b[36m${s}\x1b[0m`
const branchConnector = (isLast: boolean): string => blue(isLast ? '└── ' : '├── ')
const childIndent = (isLast: boolean): string => (isLast ? '    ' : blue('│') + '   ')

const stepTags = (path: string, config: WizardStepConfig<WizardSessionSlice>): string => {
  const tags: string[] = []
  if (config.entryPoint) tags.push('\x1b[92mentry\x1b[0m')
  if (config.reset) tags.push('\x1b[95mreset\x1b[0m')
  if (config.noReturn) tags.push('no-return')
  if (config.prereq) {
    const keys = Array.isArray(config.prereq.keys) ? config.prereq.keys : [config.prereq.keys]
    tags.push(`\x1b[38;5;208mprereq:${keys.join(',')}\x1b[0m`)
  }
  if (!config.controller) tags.push('\x1b[91m⊘ unreachable\x1b[0m')
  if (nextStepsOf(config).includes(path)) tags.push('↺ self')
  return tags.length ? ` [${tags.join(', ')}]` : ''
}

const buildView = (steps: WizardSteps<WizardSessionSlice>): string[] => {
  const lines: string[] = []
  const visited = new Set<string>()

  const walk = (path: string, prefix: string, isLast: boolean, isRoot: boolean) => {
    const config = steps[path]
    if (!config) return

    const connector = isRoot ? '' : branchConnector(isLast)

    if (visited.has(path)) {
      lines.push(`${prefix}${connector}${path} [↺ seen]`)
      return
    }

    lines.push(`${prefix}${connector}${path}${stepTags(path, config)}`)
    visited.add(path)

    const next = nextStepsOf(config).filter((p) => p in steps && p !== path)
    const childPrefix = isRoot ? prefix : prefix + childIndent(isLast)
    next.forEach((nextPath, i) => {
      walk(nextPath, childPrefix, i === next.length - 1, false)
    })
  }

  for (const path of Object.keys(steps)) {
    if (!visited.has(path)) walk(path, '', true, true)
  }

  return lines
}

const walkWizard = <S extends WizardSessionSlice>(
  wizard: Wizard<S>,
  logger: { debug: (message: string) => void }
) => {
  const lines = buildView(wizard.steps as WizardSteps<WizardSessionSlice>)
  logger.debug(`${wizard.name} wizard:\n\x1b[0m${lines.join('\n')}`)
}

export { walkWizard }
