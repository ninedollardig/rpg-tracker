import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 border border-rose-500/20 rounded-xl bg-rose-500/[0.04] space-y-2">
          <p className="text-sm text-rose-400 font-semibold">组件渲染出错</p>
          <p className="text-xs text-slate-500 font-mono leading-relaxed break-all">{this.state.error.message}</p>
          {this.state.error.stack && (
            <details>
              <summary className="text-[10px] text-slate-600 cursor-pointer">堆栈</summary>
              <pre className="text-[10px] text-slate-600 mt-1 font-mono whitespace-pre-wrap break-all">{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
