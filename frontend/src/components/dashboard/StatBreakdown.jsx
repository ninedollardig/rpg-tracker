const CAT_COLORS = {
  '生活': '#f87171',
  '学习': '#60a5fa',
  '娱乐': '#f472b6',
  '休息': '#34d399',
};

export default function StatBreakdown({ statDetail }) {
  if (!statDetail || statDetail.length === 0) {
    return (
      <div className="mt-4 pt-3 border-t border-white/[0.05]">
        <p className="text-[10px] text-slate-600">暂无活动数据，记录活动后显示属性贡献明细</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-white/[0.05]">
      <p className="text-[10px] text-slate-500 mb-2 tracking-wide">修为 → 属性 量化明细</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left py-1.5 pr-2 text-slate-600 font-normal">分类</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">累计EXP</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">主属性</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">分配EXP</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">属性值</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">副属性</th>
              <th className="text-right py-1.5 px-1 text-slate-600 font-normal">分配EXP</th>
              <th className="text-right py-1.5 pl-1 text-slate-600 font-normal">属性值</th>
            </tr>
          </thead>
          <tbody>
            {statDetail.map(row => (
              <tr key={row.category} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="text-left py-1.5 pr-2 text-white/60">
                  <span className="inline-block w-1.5 h-1.5 rounded-sm mr-1.5 align-middle"
                    style={{ backgroundColor: CAT_COLORS[row.category] || '#64748b' }} />
                  {row.category}
                  {row.wt_contrib > 0 && (
                    <span className="text-rose-400/60 text-[8px] ml-0.5">周{row.wt_contrib}</span>
                  )}
                </td>
                <td className="text-right py-1.5 px-1 text-cyan-400 font-semibold">{row.total_exp}</td>
                <td className="text-right py-1.5 px-1 text-slate-500">{row.main.name}</td>
                <td className="text-right py-1.5 px-1 text-slate-500">{row.main.exp}</td>
                <td className="text-right py-1.5 px-1 text-white/70 font-semibold">{row.main.value}</td>
                <td className="text-right py-1.5 px-1 text-slate-500">{row.sub.name}</td>
                <td className="text-right py-1.5 px-1 text-slate-500">{row.sub.exp}</td>
                <td className="text-right py-1.5 pl-1 text-white/70 font-semibold">{row.sub.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] text-slate-600 mt-1.5">
        属性值 = 1 + ⌊√(累计分配EXP) / 5⌋　|　主属性权重 100%，副属性 50%
      </p>
    </div>
  );
}
