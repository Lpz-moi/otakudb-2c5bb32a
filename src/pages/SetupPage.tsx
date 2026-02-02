import { useState } from 'react';
import { AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

const SetupPage = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const envExample = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_DISCORD_CLIENT_ID=your-discord-client-id`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">OtakuDB Configuration Required</h1>
          <p className="text-slate-400">Set up Supabase to get started</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-6 backdrop-blur">
          {/* Step 1 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-semibold flex items-center justify-center">1</div>
              <h2 className="text-xl font-semibold text-white">Create Supabase Project</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1">
                supabase.com <ExternalLink className="w-4 h-4" />
              </a> and create a free project.
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400">Takes 2 minutes. Free tier includes database, auth, and APIs.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-semibold flex items-center justify-center">2</div>
              <h2 className="text-xl font-semibold text-white">Get Your API Keys</h2>
            </div>
            <p className="text-slate-300 mb-4">
              In your Supabase project, go to <span className="text-orange-400">Settings → API</span> and copy:
            </p>
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Project URL</p>
                <p className="text-slate-200 font-mono text-sm">https://your-project.supabase.co</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Anon Public Key</p>
                <p className="text-slate-200 font-mono text-sm truncate">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-semibold flex items-center justify-center">3</div>
              <h2 className="text-xl font-semibold text-white">Update .env.local</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Edit the <span className="text-orange-400">.env.local</span> file in your project root:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 font-mono text-sm">
              <div className="text-slate-200 whitespace-pre-wrap break-words">{envExample}</div>
              <button
                onClick={() => copyToClipboard(envExample, 'env')}
                className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
              >
                {copied === 'env' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-semibold flex items-center justify-center">4</div>
              <h2 className="text-xl font-semibold text-white">Restart Dev Server</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Stop the server with <span className="text-orange-400">Ctrl+C</span> and restart:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 font-mono text-sm">
              <div className="text-slate-200">npm run dev</div>
              <button
                onClick={() => copyToClipboard('npm run dev', 'command')}
                className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
              >
                {copied === 'command' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Optional Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white">Optional: Discord OAuth</h2>
          </div>
          <p className="text-slate-300 mb-4">
            To enable Discord login, go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1">
              Discord Developer Portal <ExternalLink className="w-4 h-4" />
            </a> and add your Client ID to .env.local.
          </p>
          <p className="text-sm text-slate-400">This is optional - the app works fine without it for now.</p>
        </div>

        {/* Need Help */}
        <div className="mt-8 text-center">
          <p className="text-slate-400">
            Need help? Check out <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400">
              Supabase docs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
