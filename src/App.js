import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import OrgSetup from './pages/OrgSetup';
import StudentForm from './pages/StudentForm';
import Verify from './pages/Verify';
import CertificateSent from './pages/CertificateSent';
import Footer from './Footer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/org-setup" element={<OrgSetup />} />
        <Route path="/course/:courseId" element={<StudentForm />} />
        <Route path="/certificate-sent" element={<CertificateSent />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
       <Footer />
    </Router>
   
  );
}

export default App;


