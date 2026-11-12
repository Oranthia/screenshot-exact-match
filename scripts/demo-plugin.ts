import type { Plugin } from 'vite';
import { resolve } from 'node:path';
import { allowLocalDemo } from './demo-policy';

export function localDemoPlugin(): Plugin {
  let enabled = false; let root = '';
  return {
    name: 'italia-local-demo', enforce: 'pre',
    config(_config, env) {
      enabled = allowLocalDemo(env.command, env.mode, process.env['ITALIA_LOCAL_DEMO'], 'localhost');
      if (process.env['ITALIA_LOCAL_DEMO'] === '1' && !enabled) throw new Error('Local demo is serve/development only. Remove ITALIA_LOCAL_DEMO before building.');
      if (enabled) return { resolve: { alias: [
        { find: /^@\/data\/backend$/, replacement: resolve(process.cwd(), 'src/demo/adapter.ts') },
        { find: /^@\/components\/ui\/sonner$/, replacement: resolve(process.cwd(), 'src/demo/controls.tsx') },
      ] } };
    },
    configResolved(config) { root = config.root; },
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use((req, res, next) => {
        const host = new URL(`http://${req.headers.host ?? 'invalid'}`).hostname;
        if (!allowLocalDemo('serve', 'development', '1', host)) { res.statusCode = 403; res.end('Demo disponibile solo su localhost'); return; }
        // No CDN scripts/fonts or network services can be reached by this document.
        res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; img-src 'self' blob: data:; media-src 'self' blob: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'none'");
        if (req.url?.includes('/__demo/missing-photo.jpg')) { res.statusCode = 404; res.end('DEMO · Media non disponibile'); return; }
        next();
      });
    },
    resolveId(source) {
      if (!enabled) return;
      if (source === '@/data/backend') return resolve(root, 'src/demo/adapter.ts');
      if (source === '@/components/ui/sonner') return resolve(root, 'src/demo/controls.tsx');
    },
    transform(code, id) {
      if (!enabled) return;
      const path = id.split('?')[0]?.replaceAll('\\', '/') ?? '';
      if (path.endsWith('/src/routes/_authenticated/route.tsx')) return { code: `import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'; import { getSession } from '@/data/backend'; export const Route = createFileRoute('/_authenticated')({ssr:false,beforeLoad:async({location})=>{if(!await getSession())throw redirect({to:'/auth',search:{redirect:location.href}});},component:()=> <Outlet/>});`, map: null };
      if (path.endsWith('/src/start.ts')) return { code: code.replace('import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";', '').replace('functionMiddleware: [attachSupabaseAuth]', 'functionMiddleware: []'), map: null };
      if (path.endsWith('/src/demo/controls.tsx')) return { code: code.replace("from '@/components/ui/sonner'", "from '../components/ui/sonner'"), map: null };
      if (path.endsWith('/src/routes/__root.tsx')) return { code: code.replace('<NavigationShell />', '<Toaster position="top-center" /><NavigationShell />').replace('<Toaster position="top-center" />\n      </AuthProvider>', '</AuthProvider>'), map: null };
      if (path.includes('/src/data/backend/') || path.includes('/src/integrations/supabase/')) throw new Error(`Real backend module blocked in local demo: ${path}`);
    },
  };
}