import "./styles/App.css";
import "./styles/index.css";
import "./styles/ButtonClasses.css";
import "./styles/Dragdrop.css";
import "./styles/Loading.css";
import "./styles/Login.css";
import "./styles/Otp.css";
import "./styles/SignatureDialog.css";
import "./styles/style.css";
import "./styles/Dashboard.css";import "./styles/index.css";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";



import PrivateRoute from './utils/PrivateRoute.jsx';
import {AuthProvider} from './context/Authcontext.jsx';
import Login from './pages/auth/Login.jsx';
import Signing_Page_Self from "./pages/Signing_Page_Self.jsx";
import Dashboard from "./pages/dashboards/Dashboard.jsx";
import Signing_Page_Redirect from "./pages/Signing_Page_Redirect.jsx";
import NewCompany from "./pages/auth/NewCompany.jsx";
import Complete from "./pages/Complete.jsx";
import Voided from "./pages/Voided.jsx";
import Blocked from "./pages/Blocked.jsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.jsx";
import SuperAdminDashboard from "./pages/dashboards/SuperAdminDashboard.jsx";
import { registerLicense } from '@syncfusion/ej2-base';
import SelfSignOtherAction from "./pages/SelfSignOtherAction.jsx";
import NewIndividual from "./pages/auth/NewIndividual.jsx";
import NotFound from "./pages/NotFound.jsx";
import PasswordResetConfirm from "./pages/auth/PasswordResetConfirm.jsx";
import PasswordResetRequest from "./pages/auth/PasswordResetRequest.jsx";
import QRPreview from "./pages/QRPreview.jsx";

function App() {
  registerLicense('Mgo+DSMBPh8sVXJ0S0J+XE9HflRDX3xKf0x/TGpQb19xflBPallYVBYiSV9jS31TckVnWHlbcXFWT2NbVA==');
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" exact={true} element={<PrivateRoute><Dashboard/></PrivateRoute> } />
          <Route path="/reset/:uid/:token" element={<PasswordResetConfirm/>}  />
          <Route path="/password-reset" element={<PasswordResetRequest/>}  />
          <Route element={<Login/>} path="/login"/>
          <Route element={<NewCompany/>} path="/company/register"/>
          <Route element={<NewIndividual/>} path="/individual/register"/>
          <Route element={<Complete/>} path="/complete"/>
          <Route element={<Voided/>} path="/declined"/>
          <Route element={<Blocked/>} path="/blocked"/>
          <Route element={<PrivateRoute><SelfSignOtherAction/></PrivateRoute>} path="selfsign/otheractions"/>
          <Route element={<PrivateRoute><AdminDashboard/></PrivateRoute>} path="/admin/dashboard"/>
          <Route element={<PrivateRoute><SuperAdminDashboard/></PrivateRoute>} path="/super/admin/dashboard"/>
          <Route element={<PrivateRoute><Signing_Page_Self/></PrivateRoute>} path="/sign"/>
          <Route element={<Signing_Page_Redirect/>} path="/mail/sign/:fileurl/:signerguid"/>
          <Route element={<QRPreview/>} path="/qr/preview/:guid"/>
          <Route element={<NotFound/>} path="/404" />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </AuthProvider>
    </Router>

  );
}

export default App;



