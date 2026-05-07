import type { MapDocument } from './schema'

export interface ExampleEntry {
  slug: string
  label: string
  description: string
  map: MapDocument
}

// ---------- 1. Mindmap: Launching a SaaS ----------
const saasMindmap: MapDocument = {
  version: '1',
  type: 'mindmap',
  title: 'Launching a **SaaS**',
  description: 'Workstreams that typically gate a product launch.',
  nodes: [
    {
      id: 'root',
      label: '**SaaS launch**',
      description: 'six weeks out',
      emphasis: 'strong',
      shape: 'rounded',
    },

    { id: 'eng', label: 'Engineering', color: 'blue' },
    { id: 'eng-1', label: 'Backend `API`', parent: 'eng' },
    { id: 'eng-2', label: 'Web app', parent: 'eng' },
    { id: 'eng-3', label: 'Mobile *(later)*', parent: 'eng' },
    { id: 'eng-4', label: 'Data pipeline', parent: 'eng' },

    { id: 'design', label: 'Design', color: 'violet' },
    { id: 'design-1', label: 'Brand', parent: 'design' },
    { id: 'design-2', label: 'Onboarding flow', parent: 'design' },
    { id: 'design-3', label: 'Empty states', parent: 'design' },

    { id: 'gtm', label: 'Go-to-market', color: 'amber' },
    { id: 'gtm-1', label: '**Positioning**', parent: 'gtm' },
    { id: 'gtm-2', label: 'Pricing page', parent: 'gtm' },
    { id: 'gtm-3', label: 'Launch post', parent: 'gtm' },
    { id: 'gtm-4', label: 'Outbound list', parent: 'gtm' },

    { id: 'ops', label: 'Operations', color: 'green' },
    { id: 'ops-1', label: 'Status page', parent: 'ops' },
    { id: 'ops-2', label: 'Oncall rotation', parent: 'ops' },
    { id: 'ops-3', label: 'Support runbook', parent: 'ops' },

    { id: 'fin', label: 'Finance', color: 'cyan' },
    { id: 'fin-1', label: '`LTV / CAC` model', parent: 'fin' },
    { id: 'fin-2', label: 'Burn forecast', parent: 'fin' },

    { id: 'risk', label: 'Risks', color: 'rose' },
    { id: 'risk-1', label: 'Capacity', parent: 'risk' },
    { id: 'risk-2', label: 'Pricing fit', parent: 'risk' },
    { id: 'risk-3', label: 'Churn', parent: 'risk' },
  ],
  edges: [
    { from: 'root', to: 'eng' },
    { from: 'root', to: 'design' },
    { from: 'root', to: 'gtm' },
    { from: 'root', to: 'ops' },
    { from: 'root', to: 'fin' },
    { from: 'root', to: 'risk' },
    { from: 'eng', to: 'eng-1' },
    { from: 'eng', to: 'eng-2' },
    { from: 'eng', to: 'eng-3' },
    { from: 'eng', to: 'eng-4' },
    { from: 'design', to: 'design-1' },
    { from: 'design', to: 'design-2' },
    { from: 'design', to: 'design-3' },
    { from: 'gtm', to: 'gtm-1' },
    { from: 'gtm', to: 'gtm-2' },
    { from: 'gtm', to: 'gtm-3' },
    { from: 'gtm', to: 'gtm-4' },
    { from: 'ops', to: 'ops-1' },
    { from: 'ops', to: 'ops-2' },
    { from: 'ops', to: 'ops-3' },
    { from: 'fin', to: 'fin-1' },
    { from: 'fin', to: 'fin-2' },
    { from: 'risk', to: 'risk-1' },
    { from: 'risk', to: 'risk-2' },
    { from: 'risk', to: 'risk-3' },
  ],
}

// ---------- 2. Tree: Web platform ----------
const webPlatformTree: MapDocument = {
  version: '1',
  type: 'tree',
  title: 'Web platform',
  description: 'A pocket taxonomy of what runs in a browser.',
  nodes: [
    {
      id: 'root',
      label: '**Web platform**',
      emphasis: 'strong',
      shape: 'rounded',
    },

    { id: 'html', label: '`HTML`', color: 'amber' },
    { id: 'html-1', label: 'Semantic elements', parent: 'html' },
    { id: 'html-2', label: 'Forms', parent: 'html' },
    { id: 'html-3', label: 'Media', parent: 'html' },

    { id: 'css', label: '`CSS`', color: 'violet' },
    { id: 'css-1', label: 'Layout — *flex / grid*', parent: 'css' },
    { id: 'css-2', label: 'Typography', parent: 'css' },
    { id: 'css-3', label: 'Animation', parent: 'css' },

    { id: 'js', label: '`JavaScript`', color: 'blue' },
    { id: 'js-1', label: 'Syntax', parent: 'js' },
    { id: 'js-2', label: 'Runtime', parent: 'js' },
    { id: 'js-3', label: 'Modules', parent: 'js' },

    { id: 'apis', label: 'Web APIs', color: 'green' },
    { id: 'apis-1', label: '`DOM`', parent: 'apis' },
    { id: 'apis-2', label: '`fetch`', parent: 'apis' },
    { id: 'apis-3', label: '`WebSocket`', parent: 'apis' },
    { id: 'apis-4', label: '`Worker`', parent: 'apis' },
  ],
  edges: [
    { from: 'root', to: 'html' },
    { from: 'root', to: 'css' },
    { from: 'root', to: 'js' },
    { from: 'root', to: 'apis' },
    { from: 'html', to: 'html-1' },
    { from: 'html', to: 'html-2' },
    { from: 'html', to: 'html-3' },
    { from: 'css', to: 'css-1' },
    { from: 'css', to: 'css-2' },
    { from: 'css', to: 'css-3' },
    { from: 'js', to: 'js-1' },
    { from: 'js', to: 'js-2' },
    { from: 'js', to: 'js-3' },
    { from: 'apis', to: 'apis-1' },
    { from: 'apis', to: 'apis-2' },
    { from: 'apis', to: 'apis-3' },
    { from: 'apis', to: 'apis-4' },
  ],
}

// ---------- 3. Flowchart: Pull request lifecycle ----------
const pullRequestFlow: MapDocument = {
  version: '1',
  type: 'flowchart',
  title: '**Pull request** lifecycle',
  description: 'From `git push` to a deploy, with the failure branches.',
  nodes: [
    { id: 'push', label: '`git push`', shape: 'pill', color: 'cyan' },
    { id: 'open', label: 'Open PR', shape: 'rounded' },
    {
      id: 'ci',
      label: 'CI',
      description: 'lint · tests · types',
      shape: 'diamond',
      color: 'amber',
    },
    { id: 'review', label: 'Reviewer assigned', shape: 'rounded' },
    {
      id: 'lgtm',
      label: '**LGTM?**',
      shape: 'diamond',
      color: 'amber',
    },
    { id: 'fix-ci', label: 'Fix locally', shape: 'rounded', color: 'rose' },
    {
      id: 'address',
      label: 'Address review',
      shape: 'rounded',
      color: 'rose',
    },
    { id: 'merge', label: 'Merge to `main`', shape: 'rounded', color: 'blue' },
    { id: 'deploy', label: 'Deploy', shape: 'rounded', color: 'blue' },
    {
      id: 'done',
      label: '*Shipped*',
      shape: 'pill',
      color: 'green',
      emphasis: 'strong',
    },
  ],
  edges: [
    { from: 'push', to: 'open', direction: 'forward' },
    { from: 'open', to: 'ci', direction: 'forward' },
    { from: 'ci', to: 'review', label: 'pass', direction: 'forward' },
    {
      from: 'ci',
      to: 'fix-ci',
      label: 'fail',
      direction: 'forward',
      style: 'dashed',
    },
    { from: 'fix-ci', to: 'push', direction: 'forward', style: 'dashed' },
    { from: 'review', to: 'lgtm', direction: 'forward' },
    { from: 'lgtm', to: 'merge', label: 'yes', direction: 'forward' },
    {
      from: 'lgtm',
      to: 'address',
      label: '*changes*',
      direction: 'forward',
      style: 'dashed',
    },
    { from: 'address', to: 'push', direction: 'forward', style: 'dashed' },
    { from: 'merge', to: 'deploy', direction: 'forward' },
    { from: 'deploy', to: 'done', direction: 'forward' },
  ],
}

// ---------- 4. Graph: ER diagram — Order management ----------
const orderManagementER: MapDocument = {
  version: '1',
  type: 'graph',
  title: 'Order management **ER**',
  description: 'Customers, orders, line items, products, categories.',
  nodes: [
    {
      id: 'customer',
      label: '**Customer**',
      description: 'id (PK), email, name, created_at',
      shape: 'rectangle',
      color: 'blue',
      emphasis: 'strong',
    },
    {
      id: 'order',
      label: '**Order**',
      description: 'id (PK), customer_id (FK), placed_at, status',
      shape: 'rectangle',
      color: 'blue',
    },
    {
      id: 'line_item',
      label: '**LineItem**',
      description: 'id (PK), order_id (FK), product_id (FK), qty, unit_price',
      shape: 'rectangle',
    },
    {
      id: 'product',
      label: '**Product**',
      description: 'id (PK), sku, name, price',
      shape: 'rectangle',
      color: 'green',
    },
    {
      id: 'category',
      label: '**Category**',
      description: 'id (PK), name',
      shape: 'rectangle',
      color: 'slate',
      emphasis: 'subtle',
    },
    {
      id: 'address',
      label: '**Address**',
      description: 'id (PK), customer_id (FK), line1, city, country',
      shape: 'rectangle',
      color: 'slate',
      emphasis: 'subtle',
    },
    {
      id: 'payment',
      label: '**Payment**',
      description: 'id (PK), order_id (FK), method, amount, status',
      shape: 'rectangle',
      color: 'amber',
    },
  ],
  edges: [
    { from: 'customer', to: 'order', label: 'places (1—N)', direction: 'both' },
    { from: 'customer', to: 'address', label: 'has (1—N)', direction: 'both' },
    { from: 'order', to: 'line_item', label: 'contains (1—N)', direction: 'both' },
    { from: 'product', to: 'line_item', label: 'appears in (1—N)', direction: 'both' },
    { from: 'category', to: 'product', label: 'groups (1—N)', direction: 'both' },
    { from: 'order', to: 'payment', label: 'paid by (1—1)', direction: 'both' },
  ],
}

// ---------- 5. Concept map: Functional programming ----------
const functionalProgramming: MapDocument = {
  version: '1',
  type: 'concept',
  title: 'Functional programming',
  description: 'Core ideas and how they reinforce each other.',
  nodes: [
    {
      id: 'pure',
      label: '**Pure functions**',
      color: 'violet',
      emphasis: 'strong',
    },
    { id: 'immut', label: 'Immutability', color: 'blue' },
    { id: 'ref', label: 'Referential\ntransparency' },
    { id: 'side', label: 'Side effects', color: 'rose' },
    { id: 'hof', label: 'Higher-order\nfunctions' },
    { id: 'fc', label: 'First-class\nfunctions' },
    { id: 'compose', label: 'Composition' },
    { id: 'curry', label: 'Currying' },
    { id: 'closure', label: 'Closures' },
    { id: 'monad', label: '*Monads*', color: 'amber' },
    { id: 'lazy', label: 'Lazy evaluation' },
    { id: 'recur', label: 'Recursion' },
  ],
  edges: [
    { from: 'pure', to: 'ref', label: 'enables' },
    { from: 'pure', to: 'side', label: 'avoids', style: 'dashed' },
    { from: 'pure', to: 'immut', label: 'pairs with', direction: 'both' },
    { from: 'immut', to: 'ref', label: 'reinforces' },
    { from: 'fc', to: 'hof', label: 'enables' },
    { from: 'hof', to: 'compose', label: 'enables' },
    { from: 'hof', to: 'curry', label: 'enables' },
    { from: 'fc', to: 'closure', label: 'requires' },
    { from: 'monad', to: 'side', label: 'sequences', direction: 'both' },
    { from: 'monad', to: 'compose', label: 'composes' },
    { from: 'lazy', to: 'pure', label: 'safe under', direction: 'both' },
    { from: 'recur', to: 'immut', label: 'fits naturally' },
  ],
}

// ---------- 6. Timeline: Web platform milestones ----------
const webTimeline: MapDocument = {
  version: '1',
  type: 'timeline',
  title: 'Web platform milestones',
  description: 'A walk from `<a href>` to fetch + workers.',
  nodes: [
    {
      id: 't-1991',
      label: '**1991** — first website',
      shape: 'pill',
      color: 'slate',
    },
    {
      id: 't-1995',
      label: '**1995** — `JavaScript`',
      shape: 'pill',
      color: 'amber',
    },
    {
      id: 't-1998',
      label: '**1998** — `XMLHttpRequest`',
      shape: 'pill',
    },
    {
      id: 't-2004',
      label: '**2004** — Gmail (*Ajax*)',
      shape: 'pill',
      color: 'blue',
    },
    {
      id: 't-2008',
      label: '**2008** — `V8` & Chrome',
      shape: 'pill',
      color: 'violet',
    },
    {
      id: 't-2010',
      label: '**2010** — `Node.js`',
      shape: 'pill',
      color: 'green',
    },
    {
      id: 't-2015',
      label: '**2015** — `ES2015`',
      shape: 'pill',
      color: 'cyan',
    },
    {
      id: 't-2017',
      label: '**2017** — `async / await`',
      shape: 'pill',
    },
    {
      id: 't-2020',
      label: '**2020** — optional chaining',
      shape: 'pill',
    },
    {
      id: 't-2024',
      label: '**2024** — `WebGPU`',
      shape: 'pill',
      color: 'rose',
      emphasis: 'strong',
    },
  ],
  edges: [
    { from: 't-1991', to: 't-1995', direction: 'forward' },
    { from: 't-1995', to: 't-1998', direction: 'forward' },
    { from: 't-1998', to: 't-2004', direction: 'forward' },
    { from: 't-2004', to: 't-2008', direction: 'forward' },
    { from: 't-2008', to: 't-2010', direction: 'forward' },
    { from: 't-2010', to: 't-2015', direction: 'forward' },
    { from: 't-2015', to: 't-2017', direction: 'forward' },
    { from: 't-2017', to: 't-2020', direction: 'forward' },
    { from: 't-2020', to: 't-2024', direction: 'forward' },
  ],
}

export const EXAMPLES: ExampleEntry[] = [
  {
    slug: 'saas-launch',
    label: 'Launching a SaaS',
    description: 'Mindmap with workstream branches.',
    map: saasMindmap,
  },
  {
    slug: 'web-platform',
    label: 'Web platform',
    description: 'Tree of HTML, CSS, JS, and Web APIs.',
    map: webPlatformTree,
  },
  {
    slug: 'pull-request',
    label: 'Pull request lifecycle',
    description: 'Flowchart with CI and review branches.',
    map: pullRequestFlow,
  },
  {
    slug: 'order-management-er',
    label: 'Order management ER',
    description: 'Entity–relationship diagram with cardinalities.',
    map: orderManagementER,
  },
  {
    slug: 'functional-programming',
    label: 'Functional programming',
    description: 'Concept map with bidirectional links.',
    map: functionalProgramming,
  },
  {
    slug: 'web-milestones',
    label: 'Web platform milestones',
    description: 'Timeline from 1991 to today.',
    map: webTimeline,
  },
]
