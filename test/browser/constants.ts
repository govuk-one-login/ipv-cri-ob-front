import srcPaths from '../../src/config/paths'

const paths = {
  ...srcPaths,
  error404: '/this-page-does-not-exist'
} as const

const {
  steps: { chooseBank, consent, proveAnotherWay, start }
} = paths
export { chooseBank, consent, proveAnotherWay, start }

export default paths
