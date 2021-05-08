export default function pipeline (...xforms) {
  return src => xforms.reduce((s, xform) => xform(s), src)
}
