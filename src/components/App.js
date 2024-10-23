import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import GlobalStyle from '../GlobalStyle';
import AppContent from './AppContent';

function App() {
  return (
    <Router basename="/bitumix">
      <GlobalStyle />
      <AppContent />
    </Router>
  );
}

export default App;