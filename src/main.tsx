import {createRoot} from 'react-dom/client';
import {Component, type ReactNode} from 'react';
import App from './App.tsx';
import './index.css';

class StartupErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(this.state.failed)return <section className="startup-card" role="alert"><h1>遊戲畫面暫時無法開啟</h1><p>請重新載入遊戲。你的存檔仍保留，請不要清除網站資料。</p><button type="button" onClick={()=>window.location.reload()}>重新載入遊戲</button></section>;
    return this.props.children;
  }
}
createRoot(document.getElementById('root')!).render(<StartupErrorBoundary><App /></StartupErrorBoundary>);
