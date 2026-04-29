import { AppContainer } from './containers/AppContainer';
import './App.css';

/**
 * 应用入口组件
 * 简化为路由组件，所有业务逻辑移至容器层
 */
function App() {
  return <AppContainer />;
}

export default App;