// Every string the renderers write into the SVG. English only.
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ESCAPE_MAP[character]);
}

const MESSAGES = {
  'page.title': '{title}',
  'diagram.description.architecture': 'Architecture diagram.',
  'diagram.description.workflow': 'Workflow diagram.',
  'diagram.description.sequence': 'Sequence diagram.',
  'diagram.description.dataflow': 'Data-flow diagram.',
  'diagram.description.lifecycle': 'Lifecycle diagram.',
  'node.focus': 'Focus {label}',
  'node.focus.detail': 'Focus {label}, {detail}',
  'node.context.architecture': 'Architecture component',
  'node.context.workflow': 'Workflow node',
  'node.context.sequence': 'Sequence participant',
  'node.context.dataflow': 'Data-flow node',
  'node.context.lifecycle': 'Lifecycle state',
  'legend.title': 'Legend',

  'legend.architecture.frontend': 'Frontend',
  'legend.architecture.backend': 'Backend',
  'legend.architecture.database': 'Database',
  'legend.architecture.cloud': 'Cloud',
  'legend.architecture.security': 'Security',
  'legend.architecture.messagebus': 'Message bus',
  'legend.architecture.external': 'External',

  'legend.workflow.frontend': 'User UI',
  'legend.workflow.backend': 'Agent logic',
  'legend.workflow.security': 'Policy',
  'legend.workflow.messagebus': 'Tool action',
  'legend.workflow.database': 'Context / trace',
  'legend.workflow.cloud': 'Cloud service',
  'legend.workflow.external': 'External system',

  'legend.sequence.emphasis': 'request',
  'legend.sequence.return': 'return',
  'legend.sequence.security': 'security',
  'legend.sequence.dashed': 'async trace',
  'legend.sequence.default': 'default message',

  'legend.dataflow.emphasis': 'primary data',
  'legend.dataflow.security': 'policy / PII',
  'legend.dataflow.dashed': 'async batch',
  'legend.dataflow.database': 'data store',
  'legend.dataflow.default': 'data flow',

  'legend.lifecycle.start': 'start',
  'legend.lifecycle.active': 'active state',
  'legend.lifecycle.waiting': 'waiting',
  'legend.lifecycle.decision': 'decision',
  'legend.lifecycle.success': 'terminal success',
  'legend.lifecycle.failure': 'failure / exit',
  'legend.lifecycle.neutral': 'neutral',
  'legend.lifecycle.external': 'external',
};

export function formatMessage(template, values = {}) {
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => (
    Object.hasOwn(values, key) ? String(values[key]) : match
  ));
}

export function text(key, values = {}) {
  if (!Object.hasOwn(MESSAGES, key)) throw new Error(`Missing string ${JSON.stringify(key)}`);
  return formatMessage(MESSAGES[key], values);
}

export function stringKeys() {
  return Object.keys(MESSAGES);
}
