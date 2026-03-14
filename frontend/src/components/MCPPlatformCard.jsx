import MCPCopyBlock from './MCPCopyBlock';

export default function MCPPlatformCard({ name, description, icon, configBlocks }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#141414] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2962FF]/10 text-[#8fb3ff]">
          <span className="text-lg">{icon || '⚙️'}</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {configBlocks.map((block, idx) => (
          <MCPCopyBlock key={idx} title={block.title} config={block.config} language={block.language || 'json'} />
        ))}
      </div>
    </div>
  );
}
